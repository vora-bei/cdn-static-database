export interface IIndex<T, P> {
    //add(key: T, value: string): void;
    id: string;
    find(search: P): Promise<T[]>;
    tokenizr(search: P): P[];
    serialize(): {data: any, options: any}
    //deserialize(data: any, options: any): IIndex<T>
    keys: P[];
}