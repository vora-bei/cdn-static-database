import { ISpreadIndice, ISharedIndice } from "./interfaces";
interface IOptions<T, P> {
    id: string;
    baseUrl: string;
    deserializeShared: (options: {
        id: string;
        load(options: object): Promise<any>;
    }, deserialize: (data: any, options?: any) => ISpreadIndice<T, P>) => ISharedIndice<T, P>;
    deserialize: (options: object) => ISpreadIndice<T, P>;
}
export declare const restoreSharedIndices: <T, P>({ id, baseUrl, deserialize, deserializeShared }: IOptions<T, P>) => Promise<ISharedIndice<T, P>>;
export {};
//# sourceMappingURL=utils.browser.d.ts.map