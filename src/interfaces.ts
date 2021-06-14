
export interface ISerializeIndex {
    serialize(): { data: any, options: Object };
    serializeOptions(): Object;
    serializeData(): any[];
}

export interface IBaseIndice<T, P> {
    id: string;
    find(search: P[] | P): Promise<T[]>;
}
export interface IIndice<T, P> extends ISerializeIndex, IBaseIndice<T, P> {
    tokenizr(search: P): P[];
    add(key: T, value: P | P[]) : void;
    keys: P[];
}
export interface ISpreadIndice<T, P> extends IIndice<T, P> {
    spread(chunkSize: number): ISpreadIndice<T, P>[];
    postFilter(countResults: Map<T, number>, tokens: P[]): T[];
    preFilter(tokens: P[]): Promise<Map<T, number>>;
    findAll(indices: ISpreadIndice<T, P>[], value: P | P[]): Promise<T[]>;
}
export interface ISharedIndice<T, P> extends IBaseIndice<T, P>, ISerializeIndex {
    indices: Map<any, ISpreadIndice<T, P>>
}