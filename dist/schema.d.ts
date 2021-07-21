import { ISharedIndice } from "interfaces";
export interface IIndiceOption {
    indice: ISharedIndice<any, any>;
    path?: string;
    value?: any;
    order?: -1 | 1;
    op?: any;
}
export declare class Schema {
    primaryIndice: ISharedIndice<Record<string, unknown>, unknown>;
    indices: IIndiceOption[];
    idAttr: string;
    constructor(idAttr: string, primaryIndice: ISharedIndice<any, any>, indices: IIndiceOption[]);
}
//# sourceMappingURL=schema.d.ts.map