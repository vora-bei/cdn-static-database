"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SimpleIndice = void 0;
const CHUNK_SIZE_DEFAULT = 100;
let id_counter = 1;
class SimpleIndice {
    constructor({ id = `${id_counter++}`, isLoaded = true, load } = {}) {
        this.indices = new Map();
        this.options = {
            isLoaded,
            id,
            load
        };
        return this;
    }
    get keys() {
        const keys = [...this.indices.keys()];
        keys.sort((a, b) => {
            if (a === b) {
                return 0;
            }
            return a < b ? -1 : 1;
        });
        return keys;
    }
    get id() {
        return this.options.id;
    }
    add(key, value) {
        const tokens = [];
        if (Array.isArray(value)) {
            tokens.push(...value);
        }
        else {
            tokens.push(value);
        }
        tokens.forEach((token) => {
            const indice = this.indices.get(token) || [];
            indice.push(key);
            this.indices.set(token, indice);
        });
    }
    serializeOptions() {
        const { load, ...options } = this.options;
        return options;
    }
    serializeData() {
        return [...this.indices];
    }
    tokenizr(value) {
        return [value];
    }
    async load() {
        if (this.options.isLoaded) {
            return;
        }
        else if (this.options.load) {
            const { data } = await this.options.load(this.options);
            this.indices = new Map(data);
            this.options.isLoaded = true;
        }
        else {
            throw (Error("option load doesn't implemented"));
        }
    }
    getIndices(tokens, operator, sort = 1) {
        switch (operator) {
            case '$lte': {
                return this.getIndicesFullScanOr(tokens, (a, b) => a <= b, sort);
            }
            case '$lt': {
                return this.getIndicesFullScanOr(tokens, (a, b) => a < b, sort);
            }
            case '$gte': {
                return this.getIndicesFullScanOr(tokens, (a, b) => a >= b, sort);
            }
            case '$gt': {
                return this.getIndicesFullScanOr(tokens, (a, b) => a > b, sort);
            }
            case '$regex': {
                return this.getIndicesFullScanOr(tokens, (a, b) => {
                    return new RegExp(`${b}`).test(`${a}`);
                }, sort);
            }
            case '$nin':
            case '$ne': {
                return this.getIndicesFullScanAnd(tokens, (a, b) => a != b, sort);
            }
            case '$eq':
            case '$in':
            default:
                return tokens.reduce((sum, token) => {
                    const r = this.indices.get(token);
                    if (r) {
                        sum.push(...r);
                    }
                    return sum;
                }, []);
        }
    }
    getIndicesFullScanOr(tokens, cond, sort = 1) {
        const keys = this.keys;
        if (sort === -1) {
            keys.reverse();
        }
        return keys.reduce((sum, k) => {
            if (tokens.some(token => cond(k, token))) {
                const ids = this.indices.get(k);
                sum.push(...ids);
            }
            ;
            return sum;
        }, []);
    }
    getIndicesFullScanAnd(tokens, cond, sort = 1) {
        const keys = this.keys;
        if (sort === -1) {
            keys.reverse();
        }
        return keys.reduce((sum, k) => {
            if (tokens.every(token => cond(k, token))) {
                const ids = this.indices.get(k);
                sum.push(...ids);
            }
            ;
            return sum;
        }, []);
    }
    async preFilter(tokens, operator, sort = 1) {
        const countResults = new Map();
        await this.load();
        let t = [...tokens];
        t.sort((a, b) => {
            if (a === b) {
                return 0;
            }
            return (a < b ? 1 : -1) * sort;
        });
        const indices = this.getIndices(t, operator, sort);
        if (indices) {
            indices.forEach((id) => {
                let count = countResults.get(id) || 0;
                countResults.set(id, count + 1);
            });
        }
        if (!tokens.length) {
            const v = [...this.indices.values()];
            if (sort === -1) {
                v.reverse();
            }
            return new Map(v.flatMap((indice) => indice)
                .map(indice => [indice, 1]));
        }
        return countResults;
    }
    async find(value, operator = "$eq", sort = 1) {
        let tokens = [];
        if (value !== undefined) {
            tokens = Array.isArray(value) ? value.flatMap(v => this.tokenizr(v)) : this.tokenizr(value);
        }
        const preResult = await this.preFilter(tokens, operator, sort);
        return this.postFilter(preResult, tokens);
    }
    postFilter(countResults, tokens) {
        const results = [...countResults.entries()]
            .map(([id]) => id);
        return results;
    }
    serialize() {
        return { data: this.serializeData(), options: this.serializeOptions() };
    }
    static deserialize(data, options) {
        if (!options) {
            options = data;
            data = null;
        }
        const index = new SimpleIndice(options);
        if (!!data) {
            index.indices = data;
        }
        return index;
    }
    spread(chunkSize = CHUNK_SIZE_DEFAULT) {
        const { id, ...options } = this.options;
        const chunkSizeMax = chunkSize * 10;
        const result = [];
        let size = 0;
        let map = new Map();
        this.keys.forEach((key) => {
            const value = this.indices.get(key);
            if (size >= chunkSize) {
                result.push(SimpleIndice.deserialize(map, options));
                size = value.length;
                map = new Map([[key, value]]);
            }
            else if (size + value.length > chunkSizeMax) {
                while (value.length) {
                    const leftValue = value.splice(0, chunkSizeMax - size);
                    map.set(key, leftValue);
                    result.push(SimpleIndice.deserialize(map, options));
                    map = new Map();
                    size = 0;
                }
            }
            else {
                size = size + value.length;
                map.set(key, value);
            }
        });
        if (size != 0) {
            result.push(SimpleIndice.deserialize(map, options));
        }
        return result;
    }
    async findAll(indices, value, operator = '$eq', sort = 1) {
        let tokens = [];
        if (value !== undefined) {
            tokens = Array.isArray(value) ? value.flatMap(v => this.tokenizr(v)) : this.tokenizr(value);
        }
        const list = await Promise.all(indices.map((indice) => indice.preFilter(tokens, operator, sort)));
        const combineWeights = list.reduce((sum, weights) => {
            weights.forEach((value, key) => {
                const count = sum.get(key) || 0;
                sum.set(key, count + value);
            });
            return sum;
        }, new Map());
        return this.postFilter(combineWeights, tokens);
    }
    cursorAll(indices, value, operator = '$eq', sort = 1) {
        let tokens = [];
        if (value !== undefined) {
            tokens = Array.isArray(value) ? value.flatMap(v => this.tokenizr(v)) : this.tokenizr(value);
        }
        let result = null;
        let indiceIndex = 0;
        let data = new Map();
        const chunkSize = 20;
        const self = this;
        return {
            [Symbol.asyncIterator]() {
                return {
                    async next() {
                        if (indiceIndex === 0 && !result) {
                            data = await indices[indiceIndex].preFilter(tokens, operator, sort);
                            result = [...data.keys()];
                            result.reverse();
                        }
                        while (!(result === null || result === void 0 ? void 0 : result.length) && indiceIndex < indices.length - 1) {
                            indiceIndex++;
                            data = await indices[indiceIndex].preFilter(tokens, operator, sort);
                            result = [...data.keys()];
                            result.reverse();
                        }
                        if (result && result.length) {
                            const currentChunkSize = Math.min(chunkSize, result.length);
                            const value = result.splice(-currentChunkSize, currentChunkSize);
                            return { done: false, value };
                        }
                        else {
                            return { done: true, value: undefined };
                        }
                    }
                };
            }
        };
    }
}
exports.SimpleIndice = SimpleIndice;
//# sourceMappingURL=simple.indice.js.map