import { ISpreadIndice } from "./interfaces";
interface IOptions {
    id?: string;
    gramLen: number;
    actuationLimit: number;
    toLowcase: boolean;
    actuationLimitAuto: boolean;
    preTokenizr?(value: string): string;
    postTokenizr?(value: string, tokens: string[]): string[];
    isLoaded: boolean;
    load?(options: any): Promise<any>;
}
export declare class NgramIndice<T> implements ISpreadIndice<T, string> {
    private nGram;
    indices: Map<string, T[]>;
    options: IOptions;
    get keys(): string[];
    get id(): string;
    constructor({ id, gramLen, actuationLimit, toLowcase, actuationLimitAuto, isLoaded, load }?: Partial<IOptions>);
    add(key: T, value: string | string[]): void;
    serializeOptions(): Object;
    serializeData(): any[];
    tokenizr(value: string): string[];
    private load;
    getIndices(token: string, operator: string): T[] | undefined;
    preFilter(tokens: string[], operator?: string): Promise<Map<T, number>>;
    find(value?: string | string[], operator?: string): Promise<T[]>;
    postFilter(countResults: Map<T, number>, tokens: string[]): T[];
    private getLimit;
    serialize(): {
        data: any[];
        options: Object;
    };
    static deserialize<T, P>(data: any, options?: any): NgramIndice<T>;
    spread(chunkSize?: number): ISpreadIndice<T, string>[];
    findAll(indices: ISpreadIndice<T, string>[], value: string, operator?: string): Promise<T[]>;
    cursorAll(indices: ISpreadIndice<T, string>[], value: string | string[], operator?: string): AsyncIterable<{
        chunk: T[];
    }>;
    cursor(value?: string | string[], operator?: string): AsyncIterable<T>;
}
export {};
//# sourceMappingURL=ngram.indice.d.ts.map