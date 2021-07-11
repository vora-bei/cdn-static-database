export interface ISerializeIndex {
    serialize(): {
        data: any;
        options: Object;
    };
    serializeOptions(): Object;
    serializeData(): any[];
}
export interface IBaseIndice<T, P> {
    id: string;
    find(search: P[] | P, op?: string): Promise<T[]>;
    cursor(value?: P | P[], operator?: string, sort?: 1 | -1): AsyncIterable<T>;
}
export interface IIndice<T, P> extends ISerializeIndex, IBaseIndice<T, P> {
    tokenizr(search: P): P[];
    add(key: T, value: P | P[]): void;
    keys: P[];
}
export interface ISpreadIndice<T, P> extends IIndice<T, P> {
    spread(chunkSize: number): ISpreadIndice<T, P>[];
    postFilter(countResults: Map<T, number>, tokens: P[]): T[];
    preFilter(tokens: P[], operator?: string, sort?: 1 | -1): Promise<Map<T, number>>;
    findAll(indices: ISpreadIndice<T, P>[], value?: P | P[], operator?: string): Promise<T[]>;
    cursorAll(indices: ISpreadIndice<T, P>[], value?: P | P[], operator?: string, sort?: 1 | -1): AsyncIterable<{
        chunk: T[];
    }>;
}
export interface ISharedIndice<T, P> extends IBaseIndice<T, P>, ISerializeIndex {
    indices: Map<any, ISpreadIndice<T, P>>;
}
//# sourceMappingURL=interfaces.d.ts.map