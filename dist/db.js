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
        const { isRoot = true, } = context || {};
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
                    .map(subCriteria => this.buildIndexSearch(subCriteria, sort, { indices, isRoot: false }));
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
                subIterables.push(this.buildIndexSearch(value, sort, { path: key, indices, isRoot: false }));
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
                .map(({ indice, value, order, op }) => indice.cursor(value, op, order));
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
                .map(({ indice, value, order, op }) => indice.cursor(value, op, order));
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
            };
        };
    }
    async find(criteria, sort, skip = 0, limit) {
        console.time('find');
        const chunkSize = limit || 20;
        const primaryIndice = this.schema.primaryIndice;
        let search = this.buildIndexSearch(criteria, sort)();
        let result = [];
        const query = new mingo_1.default.Query(criteria);
        let i = 0;
        if (search.missed) {
            for await (let values of primaryIndice.cursor()) {
                for (let value of values) {
                    if (query.test(value) && i >= skip) {
                        i++;
                        result.push(value);
                        if (limit && i === limit && !search.greed) {
                            break;
                        }
                    }
                }
            }
        }
        else {
            let ids = [];
            loop: for await (let subIds of search.result) {
                ids.push(...subIds);
                if (ids.length >= chunkSize) {
                    const values = await primaryIndice.find(ids.splice(0, chunkSize));
                    for (let value of values) {
                        if (query.test(value)) {
                            i++;
                            if (i >= skip) {
                                result.push(value);
                            }
                            if (limit && i === limit && !search.greed) {
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
                for (let value of values) {
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
    testIndice(indice, key, value, path) {
        const pathEqual = indice.path === path;
        if (key !== '$regex') {
            return pathEqual;
        }
        const regex = value.toString();
        return !!regex.match(/\/^[\w\d]+/);
    }
}
exports.Db = Db;
//# sourceMappingURL=db.js.map