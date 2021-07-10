import { ISharedIndice } from "interfaces";
import { RawObject } from "mingo/util";
import { IIndiceOption, Schema } from "./schema";
interface ResultIndiceSearch {
    result: AsyncIterable<any>;
    missed: boolean;
    greed: boolean;
    paths: Set<string>;
}
export declare class Db {
    private schema;
    private customOperators;
    constructor(schema: Schema);
    buildIndexSearch(criteria: RawObject, sort?: {
        [k: string]: 1 | -1;
    }, context?: {
        path?: string;
        isRoot: boolean;
        indices: Map<ISharedIndice<any, any>, IIndiceOption>;
    }): () => ResultIndiceSearch;
    private postProcessor;
    find<T extends any>(criteria: RawObject, sort?: {
        [k: string]: 1 | -1;
    }, skip?: number, limit?: number): Promise<T[]>;
}
export {};
//# sourceMappingURL=db.d.ts.map