import { ISpreadIndice } from "./interfaces";
interface IOptions extends Record<string, unknown> {
    id?: string;
    isLoaded: boolean;
    load?(options: IOptions): Promise<never>;
}
export declare class SimpleIndice<T, P> implements ISpreadIndice<T, P> {
    indices: Map<P, T[]>;
    options: IOptions;
    get keys(): P[];
    get id(): string;
    constructor({ id, isLoaded, load }?: Partial<IOptions>);
    add(key: T, value: P | P[]): void;
    serializeOptions(): Record<string, unknown>;
    serializeData(): any[];
    tokenizr(value: P): P[];
    private load;
    private getIndices;
    private getIndicesFullScanOr;
    private getIndicesFullScanAnd;
    preFilter(tokens: P[], operator: string, sort?: -1 | 1): Promise<Map<T, number>>;
    find(value?: P | P[], operator?: string, sort?: -1 | 1): Promise<T[]>;
    postFilter(countResults: Map<T, number>, tokens: P[]): T[];
    serialize(): {
        data: Record<string, unknown>[];
        options: Record<string, unknown>;
    };
    static deserialize<T, P>(data: any, options?: IOptions): SimpleIndice<T, P>;
    spread(chunkSize?: number): ISpreadIndice<T, P>[];
    findAll(indices: ISpreadIndice<T, P>[], value?: P | P[], operator?: string, sort?: -1 | 1): Promise<T[]>;
    cursorAll(indices: ISpreadIndice<T, P>[], value?: P | P[], operator?: string, sort?: -1 | 1): AsyncIterable<T[]>;
}
export {};
//# sourceMappingURL=simple.indice.d.ts.map