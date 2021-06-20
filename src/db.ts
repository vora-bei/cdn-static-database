import mingo from "mingo";
import { addOperators, OperatorType } from "mingo/core";
import { intersection, RawObject, isOperator, isArray, isObject } from "mingo/util";
import { IIndiceOption, IndiceType, Schema } from "./schema";
addOperators(OperatorType.QUERY, ()=>({ "$text": () => true }))

const comparableOperators = new Set([
    '$eq', '$gt', '$gte', '$in', '$lt', '$lte', '$ne', '$nin'
])
const logicalOperators = new Set([
    '$and', '$or'
]);


export class Db {
    private schema: Schema;
    constructor(schema: Schema) {
        this.schema = schema;
    }
    buildIndexSearch(criteria: RawObject, sort?: RawObject, context?: { path?: string }): () => Promise<any[]> {
        const indices: IIndiceOption[] = [];
        const subCriterias: (() => Promise<any[]>)[] = [];

        for (const [key, value] of Object.entries(criteria)) {
            let path = context?.path || undefined;
            if (logicalOperators.has(key) && isArray(value)) {
                const logSubCriterias = (value as any[])
                    .map(subCriteria => this.buildIndexSearch(subCriteria, sort));
                subCriterias.push(async () => {
                    const ids: any[][] = await Promise.all(logSubCriterias.map(callback => callback()));
                    let result = ids[0];
                    ids.forEach(subres => {
                        if (key === '$and') {
                            result = intersection(result, subres);
                        } else {
                            result.push(subres)
                        }
                    });
                    return result;
                });
            } else if (key === '$text') {
                const fullTextIndice = this
                    .schema
                    .indices
                    .filter(i => i.type === IndiceType.GLOBAL && criteria['$text'])
                    .pop();
                if (fullTextIndice) {
                    indices.push({ ...fullTextIndice, value: value as any })
                }
                delete criteria['$text']
            } else if (isOperator(key)) {
                const indice = this.schema.indices.find(o => o.path === path);
                console.debug(key, path, indice);
                if (indice) {
                    indices.push({ ...indice, value: value as any, op: key })
                }
            } else if (isObject(value)) {
                subCriterias.push(this.buildIndexSearch(value as RawObject, sort, { path: key }))
            }else if (isObject(value)) {
                subCriterias.push(this.buildIndexSearch(value as RawObject, sort, { path: key }))
            } else {
                const indice = this.schema.indices.find(o => o.path === key);
                console.debug(key, path, indice);
                if (indice) {
                    indices.push({ ...indice, value: value as any, op: '$eq' })
                }
            }
        }
        return async () => {
            const ids = await Promise.all(indices.map(({ indice, op, value }) => indice.find(value, op)));
            const ids2 = await Promise.all(subCriterias.map(subCriteria => subCriteria()));
            ids.push(...ids2)
            let result = ids[0];
            ids.forEach(subres => {
                result = intersection(result, subres);
            });
            return result;
        }
    }
    async find(criteria: RawObject, sort?: RawObject, skip: number = 0, limit?: number) {
        const primaryIndice = this.schema.primaryIndice;
        let searchIds: () => Promise<any[]> = this.buildIndexSearch(criteria, sort);
        let ids: any[] | undefined;
        if (searchIds) {
            ids = await searchIds()
        }
        let cursor = primaryIndice.cursor(ids);
        const result: any[] = [];
        const query = new mingo.Query(criteria);
        let i = 0;
        for await (let value of cursor) {
            console.log(value);
            if (query.test(value) && i >= skip) {
                i++;
                result.push(value)
                if (limit && i === limit) {
                    break;
                }
            }
        }
        return result;
    }

}