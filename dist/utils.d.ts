import { ISharedIndice, ISpreadIndice } from "interfaces";
export declare const saveSharedIndices: <T, P>(indice: ISharedIndice<T, P>) => Promise<void>;
export declare const restoreSharedIndices: <T, P>(id: string, deserializeShared: (data: any, options: any, deserialize: (data: any, options?: any) => ISpreadIndice<T, P>) => ISharedIndice<T, P>, deserialize: (data: any, options?: any) => ISpreadIndice<T, P>) => Promise<ISharedIndice<T, P>>;
//# sourceMappingURL=utils.d.ts.map