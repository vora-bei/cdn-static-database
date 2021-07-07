"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.restoreSharedIndicesBrowser = exports.restoreSharedIndices = exports.saveSharedIndices = void 0;
__exportStar(require("./interfaces"), exports);
__exportStar(require("./ngram.indice"), exports);
__exportStar(require("./simple.indice"), exports);
__exportStar(require("./range.linear.indice"), exports);
var utils_ssr_1 = require("./utils.ssr");
Object.defineProperty(exports, "saveSharedIndices", { enumerable: true, get: function () { return utils_ssr_1.saveSharedIndices; } });
Object.defineProperty(exports, "restoreSharedIndices", { enumerable: true, get: function () { return utils_ssr_1.restoreSharedIndices; } });
var utils_browser_1 = require("./utils.browser");
Object.defineProperty(exports, "restoreSharedIndicesBrowser", { enumerable: true, get: function () { return utils_browser_1.restoreSharedIndices; } });
//# sourceMappingURL=index.js.map