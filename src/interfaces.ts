export interface IIndex<T> {
    //add(key: T, value: string): void;
    id: string;
    find(search: string): Promise<T[]>;
    tokenizr(search: string): string[];
    serialize(): {data: any, options: any}
    //deserialize(data: any, options: any): IIndex<T>
    keys: string[];
}