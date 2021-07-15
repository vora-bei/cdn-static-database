"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RangeLinearIndice = void 0;
const range_1 = require("./range");
const DEFAULT_CHUNK_ZIZE = 2000;
let id_counter = 1;
class RangeLinearIndice {
    constructor({ indice, chunkSize = DEFAULT_CHUNK_ZIZE, id = `${id_counter++}`, isLoaded = true, load }) {
        this.indices = new Map();
        if (indice) {
            this.indice = indice;
            this.indices = new Map(indice.spread(chunkSize).map((indice) => [range_1.Range.fromKeys(indice.keys), indice]));
        }
        this.options = { id, isLoaded, load };
    }
    get id() {
        return this.options.id;
    }
    serialize() {
        return { data: this.serializeData(), options: this.serializeOptions() };
    }
    serializeData() {
        return [...this.indices].map(([filter, indice], i) => ([[filter.left, filter.right], indice.id]));
    }
    serializeOptions() {
        var _a;
        const { load, ...options } = this.options;
        return { self: options, spread: { ...(_a = this.indice) === null || _a === void 0 ? void 0 : _a.serializeOptions(), isLoaded: false } };
    }
    testIndice(key, value) {
        if (key !== '$regex') {
            return true;
        }
        let source;
        if (value instanceof RegExp) {
            source = value.source;
        }
        source = value.toString();
        return !!source.match(/\^[\w\d]+/);
    }
    static deserialize(data, options, deserialize) {
        const indices = new Map(data.map(([[left, right], id]) => {
            return [new range_1.Range(left, right), deserialize({ ...options.spread, id })];
        }));
        const indice = new RangeLinearIndice({ ...options.self });
        indice.indices = indices;
        indice.indice = deserialize({ ...options.spread });
        return indice;
    }
    static lazy(options, deserialize) {
        const indice = new RangeLinearIndice({ ...options, isLoaded: false });
        indice.indiceDeserialize = deserialize;
        return indice;
    }
    filterIndicesByWeight(weight, tokens, operator) {
        return !!weight || !tokens.length;
    }
    async load() {
        if (this.options.isLoaded) {
            return;
        }
        else if (this.options.load) {
            if (!this.indiceDeserialize) {
                throw (Error("deserialzed doesn't set"));
            }
            const { data, options } = await this.options.load(this.options);
            const indices = new Map(data.map(([[left, right], id]) => {
                return [new range_1.Range(left, right), this.indiceDeserialize({ ...options.spread, id })];
            }));
            this.indices = indices;
            this.indice = this.indiceDeserialize({ ...options.spread });
            this.options.isLoaded = true;
        }
        else {
            throw (Error("option load doesn't implemented"));
        }
    }
    async find(value, operator = '$eq', sort = 1) {
        await this.load();
        const { indice } = this;
        if (!indice) {
            throw new Error("Spread indice doesn't initialized");
        }
        let tokens = [];
        if (value !== undefined) {
            tokens = Array.isArray(value) ? value.flatMap(v => indice.tokenizr(v)) : indice.tokenizr(value);
        }
        const indices = [...this.indices].map(([filter, indice]) => {
            const weight = tokens.reduce((w, token) => filter.test(token, operator) ? 1 + w : w, 0);
            return [weight, indice];
        }).filter(([weight]) => this.filterIndicesByWeight(weight, tokens, operator))
            .map(([_, indice]) => indice);
        if (sort === -1) {
            indices.reverse();
        }
        return indice.findAll(indices, value, operator);
    }
    cursor(value, operator = '$eq', sort = 1) {
        const load$ = this.load();
        const self = this;
        let cursor;
        let iterator;
        let isFound = false;
        let find = async () => {
            if (isFound) {
                return;
            }
            const { indice } = self;
            if (!indice) {
                throw new Error("Spread indice doesn't initialized");
            }
            let tokens = [];
            if (value !== undefined) {
                tokens = Array.isArray(value) ? value.flatMap(v => indice.tokenizr(v)) : indice.tokenizr(value);
            }
            let indices = [...self.indices].map(([filter, indice]) => {
                const weight = tokens.reduce((w, token) => filter.test(token, operator) ? 1 + w : w, 0);
                return [weight, indice];
            }).filter(([weight]) => this.filterIndicesByWeight(weight, tokens, operator))
                .map(([_, indice]) => indice);
            if (sort === -1) {
                indices.reverse();
            }
            cursor = indice.cursorAll(indices, value, operator, sort);
            isFound = true;
            iterator = cursor[Symbol.asyncIterator]();
        };
        return {
            [Symbol.asyncIterator]() {
                return {
                    async next() {
                        await load$;
                        await find();
                        return await iterator.next();
                    }
                };
            }
        };
    }
}
exports.RangeLinearIndice = RangeLinearIndice;
//# sourceMappingURL=range.linear.indice.js.map