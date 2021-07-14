"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Range = void 0;
class Range {
    constructor(left, right) {
        this.left = left;
        this.right = right;
    }
    static fromKeys(indexes) {
        const { left, right } = indexes.reduce((sum, val) => {
            let left = sum.left === null ? val : sum.left;
            let right = sum.right === null ? val : sum.right;
            return { left: left > val ? val : left, right: right < val ? val : right };
        }, { left: null, right: null });
        return new Range(left, right);
    }
    has(token) {
        return token >= this.left && token <= this.right;
    }
    match(token) {
        const match = `${token}`.match(/\/^[\w\d]+/);
        if (!match) {
            return false;
        }
        const m = match[0];
        return (m >= `${this.left}` || `${this.left}`.startsWith(m))
            && (m <= `${this.right}` || `${this.right}`.startsWith(m));
    }
    lt(token) {
        return token >= this.right || this.has(token);
    }
    gt(token) {
        return token <= this.left || this.has(token);
        ;
    }
    test(token, operator) {
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
            case '$regex':
                return this.match(`${token}`);
            default:
                return this.has(token);
        }
    }
}
exports.Range = Range;
//# sourceMappingURL=range.js.map