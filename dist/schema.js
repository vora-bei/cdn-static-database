"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Schema = exports.IndiceType = void 0;
var IndiceType;
(function (IndiceType) {
    IndiceType[IndiceType["LOCAL"] = 0] = "LOCAL";
    IndiceType[IndiceType["GLOBAL"] = 1] = "GLOBAL";
})(IndiceType = exports.IndiceType || (exports.IndiceType = {}));
var Schema = /** @class */ (function () {
    function Schema(primaryIndice, indices) {
        this.indices = indices;
        this.primaryIndice = primaryIndice;
    }
    return Schema;
}());
exports.Schema = Schema;
//# sourceMappingURL=schema.js.map