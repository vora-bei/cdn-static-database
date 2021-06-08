export interface IIndice<T, P> {
    //add(key: T, value: string): void;
    id: string;
    find(search: P): Promise<T[]>;
    tokenizr(search: P): P[];
    serialize(): { data: any, options: any }
    keys: P[];
}
export interface ISharedIndice<T, P> extends IIndice<T, P> {
    indices: Map<any, IIndice<T, P>>
}