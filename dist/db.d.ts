import { RawObject } from "mingo/util";
import { Schema } from "./schema";
export declare class Db {
    private schema;
    constructor(schema: Schema);
    buildIndexSearch(criteria: RawObject, sort?: RawObject, context?: {
        path?: string;
    }): () => Promise<any[]>;
    find(criteria: RawObject, sort?: RawObject, skip?: number, limit?: number): Promise<any[]>;
}
//# sourceMappingURL=db.d.ts.map