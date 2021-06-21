import { IIndice, ISharedIndice } from "interfaces";

export enum IndiceType {
    LOCAL,
    GLOBAL,
}
export interface IIndiceOption {
    indice: ISharedIndice<any, any>;
    path?: string;
    type: IndiceType;
    value?: any;
    order?: -1 | 1;
    op?: any;
}
export class Schema {
    primaryIndice: ISharedIndice<any, any>;
    indices: IIndiceOption[];
    constructor(primaryIndice: ISharedIndice<any, any>, indices: IIndiceOption[]) {
        this.indices = indices;
        this.primaryIndice = primaryIndice;
    }
}