import { IFindOptions, ISpreadIndice } from "./interfaces";
interface IOptions extends Record<string, unknown> {
    id?: string;
    gramLen: number;
    actuationLimit: number;
    toLowcase: boolean;
    actuationLimitAuto: boolean;
    preTokenizr?(value: string): string;
    postTokenizr?(value: string, tokens: string[]): string[];
    isLoaded: boolean;
    load?(options: IOptions): Promise<never>;
}
export declare class NgramIndice<T> implements ISpreadIndice<T, string> {
    private nGram;
    indices: Map<string, T[]>;
    options: IOptions;
    get keys(): string[];
    get id(): string;
    constructor({ id, gramLen, actuationLimit, toLowcase, actuationLimitAuto, isLoaded, load }?: Partial<IOptions>);
    add(key: T, value: string | string[]): void;
    serializeOptions(): IOptions;
    serializeData(): any[];
    tokenizr(value: string): string[];
    private load;
    getIndices(token: string, operator: string): T[] | undefined;
    preFilter(tokens: string[], { operator }?: Partial<IFindOptions>): Promise<Map<T, number>>;
    find(value?: string | string[], { operator }?: Partial<IFindOptions>): Promise<T[]>;
    postFilter(countResults: Map<T, number>, tokens: string[]): T[];
    private getLimit;
    serialize(): {
        data: any[];
        options: IOptions;
    };
    static deserialize<T, P>(data: any, options?: any): NgramIndice<T>;
    spread(chunkSize?: number): ISpreadIndice<T, string>[];
    findAll(indices: ISpreadIndice<T, string>[], value: string, { operator }?: Partial<IFindOptions>): Promise<T[]>;
    cursorAll(indices: ISpreadIndice<T, string>[], value: string | string[], { operator, chunkSize }?: Partial<IFindOptions>): AsyncIterable<T[]>;
}
export {};
//# sourceMappingURL=ngram.indice.d.ts.map