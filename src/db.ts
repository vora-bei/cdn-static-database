import { ISharedIndice } from "interfaces";
import mingo from "mingo";
import { RawObject, isOperator, isArray, isObject } from "mingo/util";
import { IIndiceOption, Schema } from "./schema";
import { combineAsyncIterable, intersectAsyncIterable } from './utils'

const comparableOperators = new Set([
    '$eq', '$gt', '$gte', '$in', '$lt', '$lte', '$ne', '$nin'
])
const logicalOperators = new Set([
    '$and', '$or'
]);
interface ResultIndiceSearch {
    result: AsyncIterable<any>;
    missed: boolean;
    greed: boolean;
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
        context?: { path?: string, indices: Map<ISharedIndice<any, any>, IIndiceOption> }
    ): () => ResultIndiceSearch {
        const indices: Map<ISharedIndice<any, any>, IIndiceOption> = new Map();
        const subIterables: (() => ResultIndiceSearch)[] = [];
        let greed = false;
        if (sort) {
            greed = true;
            for (const [key, order] of Object.entries(sort)) {
                const indice = this.schema.indices.find(o => o.path === key);
                if (indice) {
                    indices.set(indice.indice, { ...indice, order });
                    greed = false;
                }
            }
        }

        for (const [key, value] of Object.entries(criteria)) {
            if (logicalOperators.has(key) && isArray(value)) {
                const subIt = (value as any[])
                    .map(subCriteria => this.buildIndexSearch(subCriteria, sort, { indices }));

                () => {
                    const result: ResultIndiceSearch[] = subIt.map(it => it());
                    const greed = key === '$and' ? result.every(({ greed }) => greed) : result.some(({ greed }) => greed);
                    const missed = key === '$and' ? result.every(({ missed }) => missed) : result.some(({ missed }) => missed);
                    const results = result.map(({ result }) => result);
                    const sIs = key === '$and' ? intersectAsyncIterable(results) : combineAsyncIterable(results);
                    subIterables.push(() => ({
                        result: sIs,
                        greed,
                        missed
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
                const indiceOptions = this.schema.indices.find(o => o.path === key);
                if (indiceOptions) {
                    const exists = indices.get(indiceOptions.indice) || {};
                    indices.set(indiceOptions.indice, { ...exists, ...indiceOptions, value: value as any, op: '$eq' })
                }
            } else if (isObject(value)) {
                subIterables.push(this.buildIndexSearch(value as RawObject, sort, { path: key, indices }))
            } else {
                const indiceOptions = this.schema.indices.find(o => o.path === key);
                if (indiceOptions) {
                    const exists = indices.get(indiceOptions.indice) || {};
                    indices.set(indiceOptions.indice, { ...exists, ...indiceOptions, value: value as any, op: '$eq' })
                }
            }
        }
        return () => {
            const simpleIterable = [...indices.values()]
                .map(({ indice, value, order, op }) => indice.cursor(value, op, order));
            const result: ResultIndiceSearch[] = subIterables.map(it => it());
            const subGreed = result.every(({ greed }) => greed);
            const missed = result.every(({ missed }) => missed);
            const results = result.map(({ result }) => result);
            return {
                result: intersectAsyncIterable([...simpleIterable, ...results]),
                greed: greed && subGreed,
                missed: !indices.size && missed
            };
        }
    }
    async find(criteria: RawObject, sort?: { [k: string]: 1 | -1 }, skip: number = 0, limit?: number) {
        const primaryIndice = this.schema.primaryIndice;
        let search: ResultIndiceSearch = this.buildIndexSearch(criteria, sort)();
        let result: any[] = [];
        const query = new mingo.Query(criteria);
        let i = 0;
        if (search.missed) {
            for await (let value of primaryIndice.cursor()) {
                if (query.test(value) && i >= skip) {
                    i++;
                    result.push(value)
                    if (limit && i === limit && !search.greed) {
                        break;
                    }
                }
            }
        } else {
            for await (let id of search.result) {
                const [value] = await primaryIndice.find(id)
                console.debug(value, id)
                if (query.test(value) && i >= skip) {
                    i++;
                    result.push(value)
                    if (limit && i === limit && !search.greed) {
                        break;
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
        return res.all();
    }

}