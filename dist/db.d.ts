import { ISharedIndice } from "interfaces";
import { RawObject } from "mingo/util";
import { IIndiceOption, Schema } from "./schema";
interface ResultIndiceSearch {
    result: AsyncIterable<unknown[]>;
    missed: boolean;
    greed: boolean;
    paths: Set<string>;
    caches: Map<unknown, RawObject>;
}
export declare class Db {
    private schema;
    private customOperators;
    constructor(schema: Schema);
    buildIndexSearch(criteria: RawObject, sort?: {
        [k: string]: 1 | -1;
    }, skip?: number, limit?: number, context?: {
        path?: string;
        isRoot: boolean;
        indices: Map<ISharedIndice<unknown, unknown>, IIndiceOption>;
        caches?: Map<unknown, Record<string, unknown>>;
    }): () => ResultIndiceSearch;
    find<T extends unknown>(criteria: RawObject, sort?: {
        [k: string]: 1 | -1;
    }, skip?: number, limit?: number): Promise<T[]>;
    private indiceCursor;
    private testIndice;
}
export {};
//# sourceMappingURL=db.d.ts.map