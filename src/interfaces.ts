
export interface ISerializeIndex {
    serialize(): { data: unknown, options: Record<string, unknown> };
    serializeOptions(): Record<string, unknown>;
    serializeData(): unknown[];
}

export interface IBaseIndice<T, P> {
    id: string;
    find(search: P[] | P, op?: string, sort?: 1 | -1): Promise<T[]>;
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
    cursorAll(indices: ISpreadIndice<T, P>[], value?: P | P[], operator?: string, sort?: 1 | -1): AsyncIterable<T[]>;
}
export interface ISharedIndice<T, P> extends IBaseIndice<T, P>, ISerializeIndex {
    indices: Map<unknown, ISpreadIndice<T, P>>
    cursor(value?: P | P[], operator?: string, sort?: 1 | -1): AsyncIterable<T[]>;
    testIndice(key: string, value: unknown): boolean;

}