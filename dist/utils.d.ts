import { ISharedIndice, ISpreadIndice } from "./interfaces";
export declare const saveSharedIndices: <T, P>(indice: ISharedIndice<T, P>, publicPath?: string) => Promise<void>;
export declare const restoreSharedIndices: <T, P>(id: string, deserializeShared: (data: any, options: any, deserialize: (data: any, options?: any) => ISpreadIndice<T, P>) => ISharedIndice<T, P>, deserialize: (data: any, options?: any) => ISpreadIndice<T, any>) => Promise<ISharedIndice<T, P>>;
export declare function combineAsyncIterable(iterable: AsyncIterable<any>[]): AsyncGenerator<any, any[], unknown>;
export declare function intersectAsyncIterable(iterable: AsyncIterable<any>[]): AsyncGenerator<any, any[], unknown>;
//# sourceMappingURL=utils.d.ts.map