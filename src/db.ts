import { IFindOptions, ISharedIndice } from "interfaces";
import mingo from "mingo";
import { RawObject, isOperator, isArray, isObject } from "mingo/util";
import { IIndiceOption, Schema } from "./schema";
import { combineAsyncIterable, getNext, intersectAsyncIterable } from './utils'

const comparableOperators = new Set([
    '$eq', '$gt', '$gte', '$in', '$lt', '$lte', '$ne', '$nin', '$regex'
])
const logicalOperators = new Set([
    '$and', '$or'
]);
interface ResultIndiceSearch {
    result: AsyncIterable<unknown[]>;
    missed: boolean;
    greed: boolean;
    paths: Set<string>
    caches: Map<unknown, RawObject>
}

interface IPageCursor<R> {
    next: () => Promise<R[]>;
    hasNext: () => boolean;
    finish: () => void
}
function PoisonPillow() {
    // hello tslint
}
let reqId = 1;
export class Db {
    private schema: Schema;
    private customOperators: Set<string> = new Set([])

    constructor(schema: Schema) {
        this.schema = schema;
        const operators: string[] = this
            .schema
            .indices
            .map(({ path }) => path!)
            .filter((path) => path && path.startsWith('$'))
            .filter((path) => !comparableOperators.has(path))
            .filter((path) => !logicalOperators.has(path));
        this.customOperators = new Set(operators)
    }
    buildIndexSearch(
        criteria: RawObject,
        sort?: { [k: string]: 1 | -1 },
        skip?: number,
        limit?: number,
        context?: {
            currentReqId?: number,
            path?: string,
            isRoot?: boolean,
            indices?: Map<ISharedIndice<unknown, unknown>, IIndiceOption>,
            caches?: Map<unknown, Record<string, unknown>>
        }
    ): () => ResultIndiceSearch {
        const { isRoot = true, caches = new Map(), currentReqId } = context || {}
        const indices: Map<ISharedIndice<unknown, unknown>, IIndiceOption> = new Map();
        const sortIndices: Map<ISharedIndice<unknown, unknown>, IIndiceOption> = new Map();
        const subIterables: (() => ResultIndiceSearch)[] = [];
        if(isRoot){
            console.debug(`[${currentReqId}]`, 'Start building query plan')
        } else{
            console.debug(`[${currentReqId}]`, `Build nested query criteria`, criteria);
        }
        let greed = false;
        if (sort && isRoot) {
            greed = true;
            console.debug(`[${currentReqId}]`, 'Find sorting', sort, )
            for (const [key, order] of Object.entries(sort)) {
                const indice = this.schema.indices.find(o => o.path === key);
                if (indice) {
                    console.debug(`[${currentReqId}]`, 'Find sorting indice', `path: ${indice.path}`, `order: ${order}`)
                    sortIndices.set(indice.indice, { ...indice, order });
                    greed = false;
                }
            }
        }

        for (const [key, value] of Object.entries(criteria)) {
            if (logicalOperators.has(key) && isArray(value)) {
                console.debug(`[${currentReqId}]`, `Build nested query join by operator: ${key}`);
                const subIt = (value as RawObject[])
                    .map(subCriteria => this.buildIndexSearch(subCriteria, sort, skip, limit, { indices, isRoot: false, caches, currentReqId }));

                const isAnd = key === '$and';
                const result: ResultIndiceSearch[] = subIt.map(it => it());
                const greed = isAnd ? result.every(({ greed }) => greed) : result.some(({ greed }) => greed);
                const missed = isAnd ? result.every(({ missed }) => missed) : result.some(({ missed }) => missed);
                const results = result.map(({ result }) => result);
                const paths = new Set([
                    ...result.reduce((sum, { paths }) => {
                        paths.forEach((path) => {
                            sum.set(path, (sum.get(path) || 0) + 1)
                        })
                        return sum;
                    }, new Map<string, number>()).entries()
                ].filter(([, count]) => isAnd || count === result.length)
                    .map(([path]) => path)
                );
                const sIs = isAnd ? intersectAsyncIterable(results) : combineAsyncIterable(results);
                subIterables.push(() => ({
                    caches,
                    result: sIs,
                    greed,
                    missed,
                    paths,
                }));
            } else if (this.customOperators.has(key)) {
                console.debug(`[${currentReqId}]`, `Build query with custom operator: {${key}: ${value}}`);
                const fullTextIndice = this
                    .schema
                    .indices
                    .filter(i => i.path === key)
                    .pop();
                if (fullTextIndice) {
                    indices.set(fullTextIndice.indice, { ...fullTextIndice, value: value as unknown });
                }
                delete criteria[key]
            } else if (isOperator(key)) {
                const indiceOptions = this.schema.indices.find(o => this.testIndice(o, key, value, context?.path));
                if (indiceOptions) {
                    const exists = sortIndices.get(indiceOptions.indice) || {};
                    indices.set(indiceOptions.indice, { ...exists, ...indiceOptions, value: value as unknown, op: key })
                }
            } else if (isObject(value)) {
                subIterables.push(this.buildIndexSearch(value as RawObject, sort, skip, limit, { path: key, indices, isRoot: false, caches, currentReqId }))
            } else {
                const indiceOptions = this.schema.indices.find(o => o.path === key);
                if (indiceOptions) {
                    const exists = sortIndices.get(indiceOptions.indice) || {};
                    indices.set(indiceOptions.indice, { ...exists, ...indiceOptions, value: value as unknown, op: '$eq' })
                }
            }
        }
        return () => {
            const values = [...indices.values()];
            const simpleIterable = values
                .map(({ indice, value, order, op }) => {
                    return this.indiceCursor(indice, value, caches, { sort: order, operator: op, chunkSize: (limit || 0) + (skip || 0), currentReqId});
                });
            const subResult: ResultIndiceSearch[] = subIterables.map(it => it());
            const subGreed = subResult.every(({ greed }) => greed);
            const missed = subResult.every(({ missed }) => missed);
            const subIterable = subResult.map(({ result }) => result);
            const subPaths = subResult.reduce((sum, { paths }) => {
                paths.forEach(path => sum.add(path));
                return sum;
            }, new Set<string>());
            const paths = new Set([...values.map(({ path }) => path!), ...subPaths]);
            const sortedIterable = [...sortIndices.values()].filter(({ path }) => !paths.has(path!) && isRoot)
                .map(({ indice, value, order, op }) => this.indiceCursor(indice, value, caches, { sort: order, currentReqId, operator: op, chunkSize: (limit || 0) + (skip || 0) }));
            const missedAll = !sortedIterable.length && !indices.size && missed;
            const greedAll = greed && subGreed;
            if (isRoot) {
                console.debug(
                    `[${currentReqId}]`,
                    `simple ${simpleIterable.length},`,
                    `sorted ${sortedIterable.length},`,
                    `sub ${subIterable.length},`,
                    `greed ${greedAll},`,
                    `missed ${missedAll},`
                );
            }
            return {
                result: intersectAsyncIterable([...simpleIterable, ...sortedIterable, ...subIterable]),
                greed: greedAll,
                missed: missedAll,
                paths,
                caches
            };
        }
    }


    async find<T extends unknown>(criteria: RawObject, sort?: { [k: string]: 1 | -1 }, skip = 0, limit?: number): Promise<T[]> {
        console.time('find')
        const currentReqId = reqId++; 
        const chunkSize = limit || 20;
        const primaryIndice = this.schema.primaryIndice;
        const search: ResultIndiceSearch = this.buildIndexSearch(criteria, sort, skip, limit, {currentReqId} )();
        const result: unknown[] = [];
        const query = new mingo.Query(criteria);
        let i = 0;
        const caches = search.caches.values();
        const isEnough = () => limit && i === limit + skip && !search.greed;
        if (search.missed) {
            for await (const values of primaryIndice.cursor(undefined, { currentReqId })) {
                for (const value of values) {
                    if (query.test(value)) {
                        i++;
                        if (i > skip || search.greed) {
                            result.push(value)
                        }
                        if (isEnough()) {
                            break;
                        }
                    }
                }
            }
        } else {
            let ids: unknown[] = [];
            for (const value of caches) {
                if (query.test(value)) {
                    i++;
                    if (i > skip || search.greed) {
                        result.push(value)
                    }
                    if (isEnough()) {
                        ids = [];
                        break;
                    }
                }
            }
            if (!isEnough()) {
                loop:
                for await (const subIds of search.result) {
                    ids.push(...subIds);
                    const searchIds = ids.filter(id => !search.caches.has(id));
                    if (searchIds.length >= chunkSize) {
                        while (searchIds.length >= chunkSize) {
                            const values = await primaryIndice.find(searchIds.splice(0, chunkSize));
                            for (const value of [...values]) {
                                if (query.test(value)) {
                                    i++;
                                    if (i > skip || search.greed) {
                                        result.push(value);
                                    }
                                    if (isEnough()) {
                                        ids = [];
                                        break loop;
                                    }
                                }
                            }
                        }
                        ids = [];
                    }
                }
                if (ids.length) {
                    const values = await primaryIndice.find(ids);
                    for (const value of values) {
                        if (query.test(value)) {
                            i++;
                            if (i > skip || search.greed) {
                                result.push(value)
                            }
                            if (isEnough()) {
                                break;
                            }
                        }
                    }
                }
            }

        }
        let res = new mingo.Query({})
            .find(result);
        if (sort && search.greed) {
            res = res.sort(sort);
        }
        if (limit && search.greed) {
            res = res.limit(limit);
        }
        if (skip && search.greed) {
            res = res.skip(skip);
        }
        console.timeEnd('find')
        return res.all() as T[];
    }


    cursor<T extends unknown>(criteria: RawObject, sort?: { [k: string]: 1 | -1 }, skip = 0, limit?: number): IPageCursor<T> {
        const currentReqId = reqId++; 
        const chunkSize = limit || 20;
        const primaryIndice = this.schema.primaryIndice;
        const search: ResultIndiceSearch = this.buildIndexSearch(criteria, sort, skip, limit, { currentReqId })();
        let result: unknown[] = [];
        const query = new mingo.Query(criteria);
        let i = 0;
        const caches = search.caches.values();
        const isEnough = () => limit && i === limit + skip && !search.greed;
        let hasNext = true;
        const cursorQueue: {
            promise: Promise<T[]>,
            cursorSuccess: (res: unknown[]) => void,
            cursorError: (e: any) => void
        }[] = [];
        const cursorSuccess = (res: unknown[]) => cursorQueue[cursorQueue.length - 1].cursorSuccess(res);
        const cursorError = (e: any) => cursorQueue[cursorQueue.length - 1].cursorError(e);
        let lockCursorSuccess;
        let lockCursorError;
        const lockCreator = () => new Promise<T[]>((suc, err) => {
            lockCursorSuccess = suc;
            lockCursorError = err;
        });
        const cursorCreator = () => {
            let cursorSuccess, cursorError;
            const promise = new Promise<T[]>((suc, err) => {
            cursorSuccess = (res: T[]) => {
                lockCursor = lockCreator()
                cursorQueue.pop();
                if (cursorQueue.length) {
                    lockCursorSuccess();
                }
                suc(res);
            };
            cursorError = () => {
                cursorQueue.pop();
                err();
            }
        });
        return {
            promise,
            cursorSuccess,
            cursorError
        };
    };
        const getCursor = () => {
            cursorQueue.push(cursorCreator());
            if (cursorQueue.length === 1) {
                lockCursorSuccess()
            }
            return cursorQueue[cursorQueue.length - 1]
        };
        const matchResultHandler = async (value: { [name: string]: unknown }) => {
            if (query.test(value)) {
                i++;
                if (i > skip) {
                    result.push(value)
                }
                if (isEnough()) {
                    cursorSuccess(result);
                    result = [];
                    i = skip;
                    await lockCursor;
                }
            }
        }
        let lockCursor = lockCreator();
        if (search.greed) {
            throw new Error("Unsuported greed cursor yet. Please add indice")
        }
        (async () => {
            await lockCursor;
            lockCursor = lockCreator();
            try {
                if (search.missed) {
                    for await (const values of primaryIndice.cursor(undefined, { currentReqId })) {
                        for (const value of values) {
                            await matchResultHandler(value);
                        }
                    }
                } else {
                    let ids: unknown[] = [];
                    for (const value of caches) {
                        await matchResultHandler(value);
                    }
                    if (!isEnough()) {
                        for await (const subIds of search.result) {
                            ids.push(...subIds);
                            const searchIds = ids.filter(id => !search.caches.has(id));
                            if (searchIds.length >= chunkSize) {
                                while (searchIds.length >= chunkSize) {
                                    const values = await primaryIndice.find(searchIds.splice(0, chunkSize));
                                    for (const value of [...values]) {
                                        await matchResultHandler(value);
                                    }
                                }
                                ids = [];
                            }
                        }
                        if (ids.length) {
                            const values = await primaryIndice.find(ids);
                            for (const value of values) {
                                if (query.test(value)) {
                                    i++;
                                    if (i > skip) {
                                        result.push(value)
                                    }
                                }
                            }
                        }
                        cursorSuccess(result);
                        result = [];
                    }
                }
            } catch (e) {
                if (!(e instanceof PoisonPillow)) {
                    throw e;
                }
            } finally {
                lockCursorSuccess();
                hasNext = false;
            }
        })()
        return {
            next() {
                if (!hasNext) {
                    cursorError("End of list");
                }
                const cursor = getCursor();
                const start = new Date().getTime();
                cursor.promise.then(()=>{
                    const end = new Date().getTime();
                    console.debug(`[${currentReqId}]`, `Time next is ${start - end}`)
                });

                return cursor.promise;
            },
            hasNext() { return hasNext },
            finish() {
                lockCursorError(new PoisonPillow())
            }
        }
    }

    private indiceCursor(indice: ISharedIndice<unknown, unknown>, value: unknown, caches: Map<unknown, Record<string, unknown>>, { operator = '$eq', sort = 1, currentReqId }: Partial<IFindOptions> = {}): AsyncIterable<unknown[]> {
        const { idAttr } = this.schema;
        if (this.schema.primaryIndice !== indice) {
            const iterator = indice.cursor(value, { operator, sort, currentReqId });
            return iterator;
        }
        const iterator = this.schema.primaryIndice.cursor(value, { operator, sort, currentReqId });
        return {
            [Symbol.asyncIterator]() {
                return {
                    async next() {
                        const { result } = await getNext<Record<string, unknown>>(iterator[Symbol.asyncIterator](), 0);
                        if (!result.done) {
                            result.value.forEach(it => caches.set(it[idAttr], it));
                            return { done: false, value: result.value.map((it) => it[idAttr]) };
                        } else {
                            return { done: true, value: undefined };
                        }
                    }
                }
            }
        }

    }

    private testIndice(options: IIndiceOption, key: string, value: unknown, path?: string) {
        const pathEqual = options.path === path;
        return pathEqual && options.indice.testIndice(key, value);
    }

}