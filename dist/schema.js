"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Schema = void 0;
class Schema {
    constructor(idAttr, primaryIndice, indices) {
        this.indices = [...indices, { indice: primaryIndice, path: idAttr }];
        this.primaryIndice = primaryIndice;
        this.idAttr = idAttr;
    }
}
exports.Schema = Schema;
//# sourceMappingURL=schema.js.map