import { ISpreadIndice } from "./interfaces";
interface IOptions {
    id?: string;
    isLoaded: boolean;
    load?(options: any): Promise<any>;
}
export declare class SimpleIndice<T, P> implements ISpreadIndice<T, P> {
    indices: Map<P, T[]>;
    options: IOptions;
    get keys(): P[];
    get id(): string;
    constructor({ id, isLoaded, load }?: Partial<IOptions>);
    add(key: T, value: P | P[]): void;
    serializeOptions(): Object;
    serializeData(): any[];
    tokenizr(value: P): P[];
    private load;
    getIndices(token: P, operator: string): T[] | undefined;
    preFilter(tokens: P[], operator: string): Promise<Map<T, number>>;
    find(value?: P | P[], operator?: string): Promise<T[]>;
    cursor(value?: P | P[], operator?: string): AsyncIterable<T>;
    postFilter(countResults: Map<T, number>, tokens: P[]): T[];
    serialize(): {
        data: any[];
        options: Object;
    };
    static deserialize<T, P>(data: any, options?: any): SimpleIndice<T, P>;
    spread(chunkSize?: number): ISpreadIndice<T, P>[];
    findAll(indices: ISpreadIndice<T, P>[], value: P | P[], operator?: string): Promise<T[]>;
    cursorAll(indices: ISpreadIndice<T, P>[], value?: P | P[], operator?: string): AsyncIterable<T>;
}
export {};
//# sourceMappingURL=simple.indice.d.ts.map