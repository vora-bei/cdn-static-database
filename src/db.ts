import { ISharedIndice } from "interfaces";
import mingo from "mingo";
import { RawObject, isOperator, isArray, isObject } from "mingo/util";
import { IIndiceOption, Schema } from "./schema";
import { combineAsyncIterable, intersectAsyncIterable } from './utils'

const comparableOperators = new Set([
    '$eq', '$gt', '$gte', '$in', '$lt', '$lte', '$ne', '$nin','$regex'
])
const logicalOperators = new Set([
    '$and', '$or'
]);
interface ResultIndiceSearch {
    result: AsyncIterable<any>;
    missed: boolean;
    greed: boolean;
    paths: Set<string>
}
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
        context?: { path?: string, isRoot: boolean, indices: Map<ISharedIndice<any, any>, IIndiceOption> }
    ): () => ResultIndiceSearch {
        const { isRoot = true, } = context || {}
        const indices: Map<ISharedIndice<any, any>, IIndiceOption> = new Map();
        const sortIndices: Map<ISharedIndice<any, any>, IIndiceOption> = new Map();
        const subIterables: (() => ResultIndiceSearch)[] = [];
        let greed = false;
        if (sort) {
            greed = true;
            for (const [key, order] of Object.entries(sort)) {
                const indice = this.schema.indices.find(o => o.path === key);
                if (indice) {
                    sortIndices.set(indice.indice, { ...indice, order });
                    greed = false;
                }
            }
        }

        for (const [key, value] of Object.entries(criteria)) {
            if (logicalOperators.has(key) && isArray(value)) {
                const subIt = (value as any[])
                    .map(subCriteria => this.buildIndexSearch(subCriteria, sort, { indices, isRoot: false }));

                () => {
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
                    const sIs = key === '$and' ? intersectAsyncIterable(results) : combineAsyncIterable(results);
                    subIterables.push(() => ({
                        result: sIs,
                        greed,
                        missed,
                        paths,
                    }));
                }
            } else if (this.customOperators.has(key)) {
                const fullTextIndice = this
                    .schema
                    .indices
                    .filter(i => i.path === key)
                    .pop();
                if (fullTextIndice) {
                    indices.set(fullTextIndice.indice, { ...fullTextIndice, value: value as any });
                }
                delete criteria[key]
            } else if (isOperator(key)) {
                const indiceOptions = this.schema.indices.find(o => this.testIndice(o, key, value, context?.path!));
                if (indiceOptions) {
                    const exists = sortIndices.get(indiceOptions.indice) || {};
                    indices.set(indiceOptions.indice, { ...exists, ...indiceOptions, value: value as any, op: key })
                }
            } else if (isObject(value)) {
                subIterables.push(this.buildIndexSearch(value as RawObject, sort, { path: key, indices, isRoot: false }))
            } else {
                const indiceOptions = this.schema.indices.find(o => o.path === key);
                if (indiceOptions) {
                    const exists = sortIndices.get(indiceOptions.indice) || {};
                    indices.set(indiceOptions.indice, { ...exists, ...indiceOptions, value: value as any, op: '$eq' })
                }
            }
        }
        return () => {
            const values = [...indices.values()];
            const simpleIterable = values
                .map(({ indice, value, order, op }) => indice.cursor(value, op, order));
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
                .map(({ indice, value, order, op }) => indice.cursor(value, op, order));
            const missedAll = !sortedIterable.length && !indices.size && missed;
            const greedAll = greed && subGreed;
            if (isRoot) {
                console.debug(
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
            };
        }
    }
    async find<T extends any>(criteria: RawObject, sort?: { [k: string]: 1 | -1 }, skip: number = 0, limit?: number) {
        console.time('find')
        const chunkSize = limit || 20;
        const primaryIndice = this.schema.primaryIndice;
        let search: ResultIndiceSearch = this.buildIndexSearch(criteria, sort)();
        let result: any[] = [];
        const query = new mingo.Query(criteria);
        let i = 0;
        if (search.missed) {
            for await (let values of primaryIndice.cursor()) {
                for(let value of values){
                    if (query.test(value) && i >= skip) {
                        i++;
                        result.push(value)
                        if (limit && i === limit && !search.greed) {
                            break;
                        }
                    }
                }
            }
        } else {
            let ids: any[] = [];
            loop:
            for await (let subIds of search.result) {
                ids.push(...subIds);
                if (ids.length >= chunkSize) {
                    const values = await primaryIndice.find(ids.splice(0, chunkSize));
                    for (let value of values) {
                        if (query.test(value)) {
                            i++;
                            if (i >= skip) {
                                result.push(value)
                            }
                            if (limit && i === limit && !search.greed) {
                                ids = [];
                                break loop;
                            }
                        }
                    }
                    ids = [];
                }
            }
            if (ids.length) {
                const values = await primaryIndice.find(ids);
                for (let value of values) {
                    if (query.test(value)) {
                        i++;
                        if (i >= skip) {
                            result.push(value)
                        }
                        if (limit && i === limit && !search.greed) {
                            break;
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

    private testIndice( indice: IIndiceOption, key: string, value: any, path: string) {
        const pathEqual = indice.path === path;
        if(key !== '$regex'){
            return pathEqual;
        }
        const regex = (value as string).toString();
        return pathEqual && !!regex.match(/\^[\w\d]+/);
    }

}