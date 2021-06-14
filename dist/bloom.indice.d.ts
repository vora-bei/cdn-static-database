import { BloomFilter } from "bloom-filters";
import { ISharedIndice, ISpreadIndice } from "./interfaces";
interface IOptions<T> {
    errorRate?: number;
    chunkSize?: number;
    indice?: ISpreadIndice<T, string>;
    id?: string;
}
interface ISerializeOptions<T, P> {
    self: IOptions<T>;
    spread?: any;
}
export declare class BloomIndice<T> implements ISharedIndice<T, string> {
    indices: Map<BloomFilter, ISpreadIndice<T, string>>;
    private indice?;
    options: IOptions<T>;
    get id(): string;
    constructor({ errorRate, indice, chunkSize, id }: IOptions<T>);
    serializeOptions(): {
        self: {
            errorRate: number | undefined;
        };
        spread: Object | undefined;
    };
    serializeData(): any[];
    tokenizr(search: string): string[];
    get keys(): string[];
    serialize(): {
        data: any;
        options: any;
    };
    static deserialize<T>(data: [BloomFilter, T][], options: ISerializeOptions<T, string>, deserialize: (data: any, options?: any) => ISpreadIndice<T, string>): ISharedIndice<T, string>;
    find(value: string): Promise<T[]>;
}
export {};
//# sourceMappingURL=bloom.indice.d.ts.map