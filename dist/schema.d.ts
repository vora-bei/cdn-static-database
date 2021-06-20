import { ISharedIndice } from "interfaces";
export declare enum IndiceType {
    LOCAL = 0,
    GLOBAL = 1
}
export interface IIndiceOption {
    indice: ISharedIndice<any, any>;
    path?: string;
    type: IndiceType;
    value?: any;
    op?: any;
}
export declare class Schema {
    primaryIndice: ISharedIndice<any, any>;
    indices: IIndiceOption[];
    constructor(primaryIndice: ISharedIndice<any, any>, indices: IIndiceOption[]);
}
//# sourceMappingURL=schema.d.ts.map