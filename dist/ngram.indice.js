"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NgramIndice = void 0;
const n_gram_1 = __importDefault(require("n-gram"));
const CHUNK_SIZE_DEFAULT = 100;
const AUTO_LIMIT_FIND_PERCENT = 40;
let id_counter = 1;
class NgramIndice {
    constructor({ id = `${id_counter++}`, gramLen = 3, actuationLimit = 2, toLowcase = true, actuationLimitAuto = false, isLoaded = true, load } = {}) {
        this.indices = new Map();
        this.nGram = n_gram_1.default(gramLen);
        this.options = {
            gramLen,
            actuationLimit,
            toLowcase,
            actuationLimitAuto,
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
            value.forEach((v) => tokens.push(...this.tokenizr(v)));
        }
        else {
            tokens.push(...this.tokenizr(value));
        }
        tokens.forEach((token) => {
            const index = this.indices.get(token) || [];
            index.push(key);
            this.indices.set(token, index);
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
        const { preTokenizr, postTokenizr } = this.options;
        let v = preTokenizr ? preTokenizr(value) : value;
        v = this.options.toLowcase ? v.toLowerCase() : v;
        const tokens = v.split(" ").flatMap((word) => this.nGram(word));
        return postTokenizr ? postTokenizr(value, tokens) : tokens;
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
    getIndices(token, operator) {
        return this.indices.get(token);
    }
    async preFilter(tokens, operator = "$eq") {
        const countResults = new Map();
        await this.load();
        tokens.forEach((token) => {
            const indices = this.getIndices(token, operator);
            if (indices) {
                indices.forEach((id) => {
                    let count = countResults.get(id) || 0;
                    countResults.set(id, count + 1);
                });
            }
        });
        return countResults;
    }
    async find(value, operator = "$eq") {
        let tokens = [];
        if (value !== undefined) {
            tokens = Array.isArray(value) ? value.flatMap(v => this.tokenizr(v)) : this.tokenizr(value);
        }
        const preResult = await this.preFilter(tokens, operator);
        return this.postFilter(preResult, tokens);
    }
    postFilter(countResults, tokens) {
        const { actuationLimitAuto, actuationLimit } = this.options;
        const l = this.getLimit(actuationLimitAuto, tokens.length, actuationLimit);
        const results = [...countResults.entries()]
            .filter(([_, count]) => count >= l)
            .map(([id]) => id);
        return results;
    }
    getLimit(autoLimit, tokensLength, limit) {
        return autoLimit ? tokensLength * AUTO_LIMIT_FIND_PERCENT / 100 : limit;
    }
    serialize() {
        return { data: this.serializeData(), options: this.serializeOptions() };
    }
    static deserialize(data, options) {
        if (!options) {
            options = data;
            data = null;
        }
        const index = new NgramIndice(options);
        if (!!data) {
            index.indices = data;
        }
        return index;
    }
    spread(chunkSize = CHUNK_SIZE_DEFAULT) {
        const { id, ...options } = this.options;
        const result = [];
        let size = 0;
        let map = new Map();
        this.keys.forEach((key) => {
            const value = this.indices.get(key);
            if (size > chunkSize) {
                result.push(NgramIndice.deserialize(map, options));
                size = 0;
                map = new Map();
            }
            else {
                size = size + value.length;
                map.set(key, value);
            }
        });
        if (size != 0) {
            result.push(NgramIndice.deserialize(map, options));
        }
        return result;
    }
    async findAll(indices, value, operator = '$eq') {
        const tokens = Array.isArray(value) ? value.flatMap(v => this.tokenizr(v)) : this.tokenizr(value);
        const list = await Promise.all(indices.map((indice) => indice.preFilter(tokens, operator)));
        const combineWeights = list.reduce((sum, weights) => {
            weights.forEach((value, key) => {
                const count = sum.get(key) || 0;
                sum.set(key, count + value);
            });
            return sum;
        }, new Map());
        return this.postFilter(combineWeights, tokens);
    }
    cursorAll(indices, value, operator = '$eq') {
        const tokens = Array.isArray(value) ? value.flatMap(v => this.tokenizr(v)) : this.tokenizr(value);
        const list$ = Promise.all(indices.map((indice) => indice.preFilter(tokens, operator)));
        let isLoad = false;
        const self = this;
        let result;
        const load = async () => {
            if (isLoad) {
                return;
            }
            const list = await list$;
            const combineWeights = list.reduce((sum, weights) => {
                weights.forEach((value, key) => {
                    const count = sum.get(key) || 0;
                    sum.set(key, count + value);
                });
                return sum;
            }, new Map());
            result = self.postFilter(combineWeights, tokens);
            isLoad = true;
        };
        return {
            [Symbol.asyncIterator]() {
                return {
                    async next() {
                        if (!isLoad) {
                            await load();
                            return { done: false, value: result };
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
exports.NgramIndice = NgramIndice;
//# sourceMappingURL=ngram.indice.js.map