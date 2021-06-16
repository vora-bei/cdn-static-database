import { IIndice } from "interfaces";

export enum IndiceType {
    LOCAL,
    GLOBAL,
    PRIMARY,
}
export interface IIndiceOption {
    indice: IIndice<any, any>;
    path?: string; type: IndiceType;
    value: any;
}
export class Schema {
    indices: IIndiceOption[];
    constructor(indices: IIndiceOption[]) {
        this.indices = indices;
    }
}