"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Range = void 0;
var Range = /** @class */ (function () {
    function Range(left, right) {
        this.left = left;
        this.right = right;
    }
    Range.fromKeys = function (indexes) {
        var _a = indexes.reduce(function (sum, val) {
            var left = sum.left === null ? val : sum.left;
            var right = sum.right === null ? val : sum.right;
            return { left: left > val ? val : left, right: right < val ? val : right };
        }, { left: null, right: null }), left = _a.left, right = _a.right;
        return new Range(left, right);
    };
    Range.prototype.has = function (token) {
        return token >= this.left && token <= this.right;
    };
    Range.prototype.lt = function (token) {
        return token >= this.right || this.has(token);
    };
    Range.prototype.gt = function (token) {
        return token <= this.left || this.has(token);
        ;
    };
    Range.prototype.test = function (token, operator) {
        switch (operator) {
            case '$eq':
            case '$in':
                return this.has(token);
            case '$nin':
            case '$ne':
                return true;
            case '$lt':
            case '$lte':
                return this.lt(token);
            case '$lt':
            case '$lte':
                return this.gt(token);
            default:
                return this.has(token);
        }
    };
    return Range;
}());
exports.Range = Range;
//# sourceMappingURL=range.js.map