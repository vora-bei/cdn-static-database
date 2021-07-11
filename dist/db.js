"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spread = (this && this.__spread) || function () {
    for (var ar = [], i = 0; i < arguments.length; i++) ar = ar.concat(__read(arguments[i]));
    return ar;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Db = void 0;
var mingo_1 = __importDefault(require("mingo"));
var util_1 = require("mingo/util");
var utils_1 = require("./utils");
var comparableOperators = new Set([
    '$eq', '$gt', '$gte', '$in', '$lt', '$lte', '$ne', '$nin'
]);
var logicalOperators = new Set([
    '$and', '$or'
]);
var Db = /** @class */ (function () {
    function Db(schema) {
        this.customOperators = new Set([]);
        this.schema = schema;
        var operators = this
            .schema
            .indices
            .map(function (_a) {
            var path = _a.path;
            return path;
        })
            .filter(function (path) { return path && path.startsWith('$'); })
            .filter(function (path) { return !comparableOperators.has(path); })
            .filter(function (path) { return !logicalOperators.has(path); });
        this.customOperators = new Set(operators);
    }
    Db.prototype.buildIndexSearch = function (criteria, sort, context) {
        var e_1, _a, e_2, _b;
        var _this = this;
        var _c = (context || {}).isRoot, isRoot = _c === void 0 ? true : _c;
        var indices = new Map();
        var sortIndices = new Map();
        var subIterables = [];
        var greed = false;
        if (sort) {
            greed = true;
            var _loop_1 = function (key, order) {
                var indice = this_1.schema.indices.find(function (o) { return o.path === key; });
                if (indice) {
                    sortIndices.set(indice.indice, __assign(__assign({}, indice), { order: order }));
                    greed = false;
                }
            };
            var this_1 = this;
            try {
                for (var _d = __values(Object.entries(sort)), _e = _d.next(); !_e.done; _e = _d.next()) {
                    var _f = __read(_e.value, 2), key = _f[0], order = _f[1];
                    _loop_1(key, order);
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (_e && !_e.done && (_a = _d.return)) _a.call(_d);
                }
                finally { if (e_1) throw e_1.error; }
            }
        }
        var _loop_2 = function (key, value) {
            if (logicalOperators.has(key) && util_1.isArray(value)) {
                var subIt_1 = value
                    .map(function (subCriteria) { return _this.buildIndexSearch(subCriteria, sort, { indices: indices, isRoot: false }); });
                (function () {
                    var isAnd = key === '$and';
                    var result = subIt_1.map(function (it) { return it(); });
                    var greed = isAnd ? result.every(function (_a) {
                        var greed = _a.greed;
                        return greed;
                    }) : result.some(function (_a) {
                        var greed = _a.greed;
                        return greed;
                    });
                    var missed = isAnd ? result.every(function (_a) {
                        var missed = _a.missed;
                        return missed;
                    }) : result.some(function (_a) {
                        var missed = _a.missed;
                        return missed;
                    });
                    var results = result.map(function (_a) {
                        var result = _a.result;
                        return result;
                    });
                    var paths = new Set(__spread(result.reduce(function (sum, _a) {
                        var paths = _a.paths;
                        paths.forEach(function (path) {
                            sum.set(path, (sum.get(path) || 0) + 1);
                        });
                        return sum;
                    }, new Map()).entries()).filter(function (_a) {
                        var _b = __read(_a, 2), count = _b[1];
                        return isAnd || count === result.length;
                    })
                        .map(function (_a) {
                        var _b = __read(_a, 1), path = _b[0];
                        return path;
                    }));
                    var sIs = key === '$and' ? utils_1.intersectAsyncIterable(results) : utils_1.combineAsyncIterable(results);
                    subIterables.push(function () { return ({
                        result: sIs,
                        greed: greed,
                        missed: missed,
                        paths: paths,
                    }); });
                });
            }
            else if (this_2.customOperators.has(key)) {
                var fullTextIndice = this_2.schema
                    .indices
                    .filter(function (i) { return i.path === key; })
                    .pop();
                if (fullTextIndice) {
                    indices.set(fullTextIndice.indice, __assign(__assign({}, fullTextIndice), { value: value }));
                }
                delete criteria[key];
            }
            else if (util_1.isOperator(key)) {
                var indiceOptions = this_2.schema.indices.find(function (o) { return o.path === (context === null || context === void 0 ? void 0 : context.path); });
                if (indiceOptions) {
                    var exists = sortIndices.get(indiceOptions.indice) || {};
                    indices.set(indiceOptions.indice, __assign(__assign(__assign({}, exists), indiceOptions), { value: value, op: key }));
                }
            }
            else if (util_1.isObject(value)) {
                subIterables.push(this_2.buildIndexSearch(value, sort, { path: key, indices: indices, isRoot: false }));
            }
            else {
                var indiceOptions = this_2.schema.indices.find(function (o) { return o.path === key; });
                if (indiceOptions) {
                    var exists = sortIndices.get(indiceOptions.indice) || {};
                    indices.set(indiceOptions.indice, __assign(__assign(__assign({}, exists), indiceOptions), { value: value, op: '$eq' }));
                }
            }
        };
        var this_2 = this;
        try {
            for (var _g = __values(Object.entries(criteria)), _h = _g.next(); !_h.done; _h = _g.next()) {
                var _j = __read(_h.value, 2), key = _j[0], value = _j[1];
                _loop_2(key, value);
            }
        }
        catch (e_2_1) { e_2 = { error: e_2_1 }; }
        finally {
            try {
                if (_h && !_h.done && (_b = _g.return)) _b.call(_g);
            }
            finally { if (e_2) throw e_2.error; }
        }
        return function () {
            var values = __spread(indices.values());
            var simpleIterable = values
                .map(function (_a) {
                var indice = _a.indice, value = _a.value, order = _a.order, op = _a.op;
                return indice.cursor(value, op, order);
            });
            var subResult = subIterables.map(function (it) { return it(); });
            var subGreed = subResult.every(function (_a) {
                var greed = _a.greed;
                return greed;
            });
            var missed = subResult.every(function (_a) {
                var missed = _a.missed;
                return missed;
            });
            var subIterable = subResult.map(function (_a) {
                var result = _a.result;
                return result;
            });
            var subPaths = subResult.reduce(function (sum, _a) {
                var paths = _a.paths;
                paths.forEach(function (path) { return sum.add(path); });
                return sum;
            }, new Set());
            var paths = new Set(__spread(values.map(function (_a) {
                var path = _a.path;
                return path;
            }), subPaths));
            var sortedIterable = __spread(sortIndices.values()).filter(function (_a) {
                var path = _a.path;
                return !paths.has(path) && isRoot;
            })
                .map(function (_a) {
                var indice = _a.indice, value = _a.value, order = _a.order, op = _a.op;
                return indice.cursor(value, op, order);
            });
            var missedAll = !sortedIterable.length && !indices.size && missed;
            var greedAll = greed && subGreed;
            if (isRoot) {
                console.debug("simple " + simpleIterable.length + ",", "sorted " + sortedIterable.length + ",", "sub " + subIterable.length + ",", "greed " + greedAll + ",", "missed " + missedAll + ",");
            }
            return {
                result: utils_1.intersectAsyncIterable(__spread(simpleIterable, sortedIterable, subIterable)),
                greed: greedAll,
                missed: missedAll,
                paths: paths,
            };
        };
    };
    Db.prototype.find = function (criteria, sort, skip, limit) {
        var e_3, _a, e_4, _b;
        if (skip === void 0) { skip = 0; }
        return __awaiter(this, void 0, void 0, function () {
            var chunkSize, primaryIndice, search, result, query, i, _c, _d, values, values_1, values_1_1, value, e_3_1, ids, _e, _f, subIds, values, values_2, values_2_1, value, e_4_1, values, values_3, values_3_1, value, res;
            var e_5, _g, e_6, _h, e_7, _j;
            return __generator(this, function (_k) {
                switch (_k.label) {
                    case 0:
                        console.time('find');
                        chunkSize = limit || 20;
                        primaryIndice = this.schema.primaryIndice;
                        search = this.buildIndexSearch(criteria, sort)();
                        result = [];
                        query = new mingo_1.default.Query(criteria);
                        i = 0;
                        if (!search.missed) return [3 /*break*/, 13];
                        _k.label = 1;
                    case 1:
                        _k.trys.push([1, 6, 7, 12]);
                        _c = __asyncValues(primaryIndice.cursor());
                        _k.label = 2;
                    case 2: return [4 /*yield*/, _c.next()];
                    case 3:
                        if (!(_d = _k.sent(), !_d.done)) return [3 /*break*/, 5];
                        values = _d.value;
                        try {
                            for (values_1 = (e_5 = void 0, __values(values)), values_1_1 = values_1.next(); !values_1_1.done; values_1_1 = values_1.next()) {
                                value = values_1_1.value;
                                if (query.test(value) && i >= skip) {
                                    i++;
                                    result.push(value);
                                    if (limit && i === limit && !search.greed) {
                                        break;
                                    }
                                }
                            }
                        }
                        catch (e_5_1) { e_5 = { error: e_5_1 }; }
                        finally {
                            try {
                                if (values_1_1 && !values_1_1.done && (_g = values_1.return)) _g.call(values_1);
                            }
                            finally { if (e_5) throw e_5.error; }
                        }
                        _k.label = 4;
                    case 4: return [3 /*break*/, 2];
                    case 5: return [3 /*break*/, 12];
                    case 6:
                        e_3_1 = _k.sent();
                        e_3 = { error: e_3_1 };
                        return [3 /*break*/, 12];
                    case 7:
                        _k.trys.push([7, , 10, 11]);
                        if (!(_d && !_d.done && (_a = _c.return))) return [3 /*break*/, 9];
                        return [4 /*yield*/, _a.call(_c)];
                    case 8:
                        _k.sent();
                        _k.label = 9;
                    case 9: return [3 /*break*/, 11];
                    case 10:
                        if (e_3) throw e_3.error;
                        return [7 /*endfinally*/];
                    case 11: return [7 /*endfinally*/];
                    case 12: return [3 /*break*/, 28];
                    case 13:
                        ids = [];
                        _k.label = 14;
                    case 14:
                        _k.trys.push([14, 20, 21, 26]);
                        _e = __asyncValues(search.result);
                        _k.label = 15;
                    case 15: return [4 /*yield*/, _e.next()];
                    case 16:
                        if (!(_f = _k.sent(), !_f.done)) return [3 /*break*/, 19];
                        subIds = _f.value;
                        ids.push.apply(ids, __spread(subIds));
                        if (!(ids.length >= chunkSize)) return [3 /*break*/, 18];
                        return [4 /*yield*/, primaryIndice.find(ids.splice(0, chunkSize))];
                    case 17:
                        values = _k.sent();
                        try {
                            for (values_2 = (e_6 = void 0, __values(values)), values_2_1 = values_2.next(); !values_2_1.done; values_2_1 = values_2.next()) {
                                value = values_2_1.value;
                                if (query.test(value)) {
                                    i++;
                                    if (i >= skip) {
                                        result.push(value);
                                    }
                                    if (limit && i === limit - 1 && !search.greed) {
                                        ids = [];
                                        return [3 /*break*/, 19];
                                    }
                                }
                            }
                        }
                        catch (e_6_1) { e_6 = { error: e_6_1 }; }
                        finally {
                            try {
                                if (values_2_1 && !values_2_1.done && (_h = values_2.return)) _h.call(values_2);
                            }
                            finally { if (e_6) throw e_6.error; }
                        }
                        ids = [];
                        _k.label = 18;
                    case 18: return [3 /*break*/, 15];
                    case 19: return [3 /*break*/, 26];
                    case 20:
                        e_4_1 = _k.sent();
                        e_4 = { error: e_4_1 };
                        return [3 /*break*/, 26];
                    case 21:
                        _k.trys.push([21, , 24, 25]);
                        if (!(_f && !_f.done && (_b = _e.return))) return [3 /*break*/, 23];
                        return [4 /*yield*/, _b.call(_e)];
                    case 22:
                        _k.sent();
                        _k.label = 23;
                    case 23: return [3 /*break*/, 25];
                    case 24:
                        if (e_4) throw e_4.error;
                        return [7 /*endfinally*/];
                    case 25: return [7 /*endfinally*/];
                    case 26:
                        if (!ids.length) return [3 /*break*/, 28];
                        return [4 /*yield*/, primaryIndice.find(ids)];
                    case 27:
                        values = _k.sent();
                        try {
                            for (values_3 = __values(values), values_3_1 = values_3.next(); !values_3_1.done; values_3_1 = values_3.next()) {
                                value = values_3_1.value;
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
                        catch (e_7_1) { e_7 = { error: e_7_1 }; }
                        finally {
                            try {
                                if (values_3_1 && !values_3_1.done && (_j = values_3.return)) _j.call(values_3);
                            }
                            finally { if (e_7) throw e_7.error; }
                        }
                        _k.label = 28;
                    case 28:
                        res = new mingo_1.default.Query({})
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
                        return [2 /*return*/, res.all()];
                }
            });
        });
    };
    return Db;
}());
exports.Db = Db;
//# sourceMappingURL=db.js.map