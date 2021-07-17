"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Db = void 0;
const mingo_1 = __importDefault(require("mingo"));
const util_1 = require("mingo/util");
const utils_1 = require("./utils");
const comparableOperators = new Set([
    '$eq', '$gt', '$gte', '$in', '$lt', '$lte', '$ne', '$nin', '$regex'
]);
const logicalOperators = new Set([
    '$and', '$or'
]);
class Db {
    constructor(schema) {
        this.customOperators = new Set([]);
        this.schema = schema;
        const operators = this
            .schema
            .indices
            .map(({ path }) => path)
            .filter((path) => path && path.startsWith('$'))
            .filter((path) => !comparableOperators.has(path))
            .filter((path) => !logicalOperators.has(path));
        this.customOperators = new Set(operators);
    }
    buildIndexSearch(criteria, sort, context) {
        const { isRoot = true, caches = new Map() } = context || {};
        const indices = new Map();
        const sortIndices = new Map();
        const subIterables = [];
        let greed = false;
        if (sort) {
            greed = true;
            for (const [key, order] of Object.entries(sort)) {
                const indice = this.schema.indices.find(o => o.path === key);
                if (indice) {
                    sortIndices.set(indice.indice, { ...indice, order });
                    greed = false;
                }
            }
        }
        for (const [key, value] of Object.entries(criteria)) {
            if (logicalOperators.has(key) && util_1.isArray(value)) {
                const subIt = value
                    .map(subCriteria => this.buildIndexSearch(subCriteria, sort, { indices, isRoot: false, caches }));
                () => {
                    const isAnd = key === '$and';
                    const result = subIt.map(it => it());
                    const greed = isAnd ? result.every(({ greed }) => greed) : result.some(({ greed }) => greed);
                    const missed = isAnd ? result.every(({ missed }) => missed) : result.some(({ missed }) => missed);
                    const results = result.map(({ result }) => result);
                    const paths = new Set([
                        ...result.reduce((sum, { paths }) => {
                            paths.forEach((path) => {
                                sum.set(path, (sum.get(path) || 0) + 1);
                            });
                            return sum;
                        }, new Map()).entries()
                    ].filter(([, count]) => isAnd || count === result.length)
                        .map(([path]) => path));
                    const sIs = key === '$and' ? utils_1.intersectAsyncIterable(results) : utils_1.combineAsyncIterable(results);
                    subIterables.push(() => ({
                        caches,
                        result: sIs,
                        greed,
                        missed,
                        paths,
                    }));
                };
            }
            else if (this.customOperators.has(key)) {
                const fullTextIndice = this
                    .schema
                    .indices
                    .filter(i => i.path === key)
                    .pop();
                if (fullTextIndice) {
                    indices.set(fullTextIndice.indice, { ...fullTextIndice, value: value });
                }
                delete criteria[key];
            }
            else if (util_1.isOperator(key)) {
                const indiceOptions = this.schema.indices.find(o => this.testIndice(o, key, value, context === null || context === void 0 ? void 0 : context.path));
                if (indiceOptions) {
                    const exists = sortIndices.get(indiceOptions.indice) || {};
                    indices.set(indiceOptions.indice, { ...exists, ...indiceOptions, value: value, op: key });
                }
            }
            else if (util_1.isObject(value)) {
                subIterables.push(this.buildIndexSearch(value, sort, { path: key, indices, isRoot: false, caches }));
            }
            else {
                const indiceOptions = this.schema.indices.find(o => o.path === key);
                if (indiceOptions) {
                    const exists = sortIndices.get(indiceOptions.indice) || {};
                    indices.set(indiceOptions.indice, { ...exists, ...indiceOptions, value: value, op: '$eq' });
                }
            }
        }
        return () => {
            const values = [...indices.values()];
            const simpleIterable = values
                .map(({ indice, value, order, op }) => {
                return this.indiceCursor(indice, value, caches, order, op);
            });
            const subResult = subIterables.map(it => it());
            const subGreed = subResult.every(({ greed }) => greed);
            const missed = subResult.every(({ missed }) => missed);
            const subIterable = subResult.map(({ result }) => result);
            const subPaths = subResult.reduce((sum, { paths }) => {
                paths.forEach(path => sum.add(path));
                return sum;
            }, new Set());
            const paths = new Set([...values.map(({ path }) => path), ...subPaths]);
            const sortedIterable = [...sortIndices.values()].filter(({ path }) => !paths.has(path) && isRoot)
                .map(({ indice, value, order, op }) => this.indiceCursor(indice, value, caches, order, op));
            const missedAll = !sortedIterable.length && !indices.size && missed;
            const greedAll = greed && subGreed;
            if (isRoot) {
                console.debug(`simple ${simpleIterable.length},`, `sorted ${sortedIterable.length},`, `sub ${subIterable.length},`, `greed ${greedAll},`, `missed ${missedAll},`);
            }
            return {
                result: utils_1.intersectAsyncIterable([...simpleIterable, ...sortedIterable, ...subIterable]),
                greed: greedAll,
                missed: missedAll,
                paths,
                caches
            };
        };
    }
    async find(criteria, sort, skip = 0, limit) {
        console.time('find');
        const chunkSize = limit || 20;
        const primaryIndice = this.schema.primaryIndice;
        const search = this.buildIndexSearch(criteria, sort)();
        const result = [];
        const query = new mingo_1.default.Query(criteria);
        let i = 0;
        const caches = search.caches.values();
        const isEnough = () => limit && i === limit && !search.greed;
        if (search.missed) {
            for await (const values of primaryIndice.cursor()) {
                for (const value of values) {
                    if (query.test(value) && i >= skip) {
                        i++;
                        result.push(value);
                        if (isEnough()) {
                            break;
                        }
                    }
                }
            }
        }
        else {
            let ids = [];
            for (const value of caches) {
                if (query.test(value)) {
                    i++;
                    if (i >= skip) {
                        result.push(value);
                    }
                    if (isEnough()) {
                        ids = [];
                        break;
                    }
                }
            }
            if (!isEnough()) {
                loop: for await (const subIds of search.result) {
                    ids.push(...subIds);
                    if (ids.length >= chunkSize) {
                        const searchIds = ids.filter(id => !search.caches.has(id));
                        const values = await primaryIndice.find(searchIds.splice(0, chunkSize));
                        for (const value of [...values]) {
                            if (query.test(value)) {
                                i++;
                                if (i >= skip) {
                                    result.push(value);
                                }
                                if (isEnough()) {
                                    ids = [];
                                    break loop;
                                }
                            }
                        }
                        ids = [];
                    }
                }
                if (ids.length) {
                    const values = await primaryIndice.find(ids);
                    for (const value of values) {
                        if (query.test(value)) {
                            i++;
                            if (i >= skip) {
                                result.push(value);
                            }
                            if (limit && i === limit && !search.greed) {
                                break;
                            }
                        }
                    }
                }
            }
        }
        let res = new mingo_1.default.Query({})
            .find(result);
        if (sort && search.greed) {
            res = res.sort(sort);
        }
        if (limit && search.greed) {
            res = res.limit(limit);
        }
        if (skip && search.greed) {
            res = res.skip(skip);
        }
        console.timeEnd('find');
        return res.all();
    }
    indiceCursor(indice, value, caches, order, op) {
        const { idAttr } = this.schema;
        if (this.schema.primaryIndice !== indice) {
            const iterator = indice.cursor(value, op, order);
            return iterator;
        }
        const iterator = this.schema.primaryIndice.cursor(value, op, order);
        return {
            [Symbol.asyncIterator]() {
                return {
                    async next() {
                        const { result } = await utils_1.getNext(iterator[Symbol.asyncIterator](), 0);
                        if (!result.done) {
                            result.value.forEach(it => caches.set(it[idAttr], it));
                            return { done: false, value: result.value.map((it) => it[idAttr]) };
                        }
                        else {
                            return { done: true, value: undefined };
                        }
                    }
                };
            }
        };
    }
    testIndice(options, key, value, path) {
        const pathEqual = options.path === path;
        return pathEqual && options.indice.testIndice(key, value);
    }
}
exports.Db = Db;
//# sourceMappingURL=db.js.map