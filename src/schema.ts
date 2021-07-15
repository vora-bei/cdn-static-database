import { IIndice, ISharedIndice } from "interfaces";

export interface IIndiceOption {
    indice: ISharedIndice<any, any>;
    path?: string;
    value?: any;
    order?: -1 | 1;
    op?: any;
}
export class Schema {
    primaryIndice: ISharedIndice<any, any>;
    indices: IIndiceOption[];
    idAttr: string;
    constructor(idAttr: string, primaryIndice: ISharedIndice<any, any>, indices: IIndiceOption[]) {
        this.indices = [...indices, {indice: primaryIndice, path: idAttr}];
        this.primaryIndice = primaryIndice;
        this.idAttr = idAttr;
    }
}