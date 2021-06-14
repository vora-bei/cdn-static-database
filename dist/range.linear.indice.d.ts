import { ISharedIndice, ISpreadIndice } from "./interfaces";
import { Range } from "./range";
interface IOptions<T, P> {
    chunkSize?: number;
    indice?: ISpreadIndice<T, P>;
    id?: string;
    isLoaded: boolean;
    load?(options: any): Promise<any>;
}
interface ISerializeOptions<T, P> {
    self: IOptions<T, P>;
    spread?: any;
}
export declare class RangeLinearIndice<T, P> implements ISharedIndice<T, P> {
    indices: Map<Range<P>, ISpreadIndice<T, P>>;
    private indice?;
    private indiceDeserialize?;
    options: IOptions<T, P>;
    get id(): string;
    constructor({ indice, chunkSize, id, isLoaded, load }: Partial<IOptions<T, P>>);
    serialize(): {
        data: any;
        options: any;
    };
    serializeData(): (string | P[])[][];
    serializeOptions(): ISerializeOptions<T, P>;
    static deserialize<T, P>(data: [[P, P], T][], options: ISerializeOptions<T, P>, deserialize: (data: any, options?: any) => ISpreadIndice<T, P>): ISharedIndice<T, P>;
    static lazy<T, P>(options: {
        id: string;
        load(options: object): Promise<any>;
    }, deserialize: (options: object) => ISpreadIndice<T, P>): ISharedIndice<T, P>;
    private load;
    find(value: P): Promise<T[]>;
}
export {};
//# sourceMappingURL=range.linear.indice.d.ts.map