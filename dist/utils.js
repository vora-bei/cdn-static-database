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
var __await = (this && this.__await) || function (v) { return this instanceof __await ? (this.v = v, this) : new __await(v); }
var __asyncGenerator = (this && this.__asyncGenerator) || function (thisArg, _arguments, generator) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var g = generator.apply(thisArg, _arguments || []), i, q = [];
    return i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i;
    function verb(n) { if (g[n]) i[n] = function (v) { return new Promise(function (a, b) { q.push([n, v, a, b]) > 1 || resume(n, v); }); }; }
    function resume(n, v) { try { step(g[n](v)); } catch (e) { settle(q[0][3], e); } }
    function step(r) { r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r); }
    function fulfill(value) { resume("next", value); }
    function reject(value) { resume("throw", value); }
    function settle(f, v) { if (f(v), q.shift(), q.length) resume(q[0][0], q[0][1]); }
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
var __spreadArray = (this && this.__spreadArray) || function (to, from) {
    for (var i = 0, il = from.length, j = to.length; i < il; i++, j++)
        to[j] = from[i];
    return to;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.intersectAsyncIterable = exports.combineAsyncIterable = exports.restoreSharedIndices = exports.saveSharedIndices = void 0;
var fs_1 = __importDefault(require("fs"));
var path_1 = require("path");
var util_1 = __importDefault(require("util"));
var writeFile = util_1.default.promisify(fs_1.default.writeFile);
var readFile = util_1.default.promisify(fs_1.default.readFile);
var mkdir = util_1.default.promisify(fs_1.default.mkdir);
var exists = util_1.default.promisify(fs_1.default.exists);
var saveSharedIndices = function (indice, publicPath) {
    if (publicPath === void 0) { publicPath = '.'; }
    return __awaiter(void 0, void 0, void 0, function () {
        var dir, existDir, _a, _b, _c, _, v, e_1_1;
        var e_1, _d;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    dir = path_1.join(publicPath, indice.id);
                    return [4 /*yield*/, exists(dir)];
                case 1:
                    existDir = _e.sent();
                    if (!!existDir) return [3 /*break*/, 3];
                    return [4 /*yield*/, mkdir(dir)];
                case 2:
                    _e.sent();
                    _e.label = 3;
                case 3: return [4 /*yield*/, writeFile(path_1.join(dir, 'index.json'), JSON.stringify(indice.serialize()))];
                case 4:
                    _e.sent();
                    _e.label = 5;
                case 5:
                    _e.trys.push([5, 10, 11, 12]);
                    _a = __values(indice.indices), _b = _a.next();
                    _e.label = 6;
                case 6:
                    if (!!_b.done) return [3 /*break*/, 9];
                    _c = __read(_b.value, 2), _ = _c[0], v = _c[1];
                    return [4 /*yield*/, writeFile(path_1.join(dir, "chunk_" + v.id + ".json"), JSON.stringify({ data: v.serializeData(), options: { id: v.id } }))];
                case 7:
                    _e.sent();
                    _e.label = 8;
                case 8:
                    _b = _a.next();
                    return [3 /*break*/, 6];
                case 9: return [3 /*break*/, 12];
                case 10:
                    e_1_1 = _e.sent();
                    e_1 = { error: e_1_1 };
                    return [3 /*break*/, 12];
                case 11:
                    try {
                        if (_b && !_b.done && (_d = _a.return)) _d.call(_a);
                    }
                    finally { if (e_1) throw e_1.error; }
                    return [7 /*endfinally*/];
                case 12: return [2 /*return*/];
            }
        });
    });
};
exports.saveSharedIndices = saveSharedIndices;
var restoreSharedIndices = function (id, deserializeShared, deserialize) { return __awaiter(void 0, void 0, void 0, function () {
    var load, jsonRaw, json;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                load = function (options) { return __awaiter(void 0, void 0, void 0, function () {
                    var _a, _b;
                    return __generator(this, function (_c) {
                        switch (_c.label) {
                            case 0:
                                console.debug('load', options.id);
                                _b = (_a = JSON).parse;
                                return [4 /*yield*/, readFile("./" + id + "/chunk_" + options.id + ".json")];
                            case 1: return [2 /*return*/, _b.apply(_a, [(_c.sent()).toString()])];
                        }
                    });
                }); };
                return [4 /*yield*/, readFile("./" + id + "/index.json")];
            case 1:
                jsonRaw = _a.sent();
                json = JSON.parse(jsonRaw.toString());
                return [2 /*return*/, deserializeShared(json.data, json.options, function (options) { return deserialize(__assign(__assign({}, options), { load: load })); })];
        }
    });
}); };
exports.restoreSharedIndices = restoreSharedIndices;
function combineAsyncIterable(iterable) {
    return __asyncGenerator(this, arguments, function combineAsyncIterable_1() {
        function getNext(asyncIterator, index) {
            return asyncIterator.next().then(function (result) { return ({
                index: index,
                result: result,
            }); });
        }
        var asyncIterators, results, count, never, nextPromises, _a, index, result, _b, _c, _d, index, iterator;
        var e_2, _e;
        return __generator(this, function (_f) {
            switch (_f.label) {
                case 0:
                    asyncIterators = Array.from(iterable, function (o) { return o[Symbol.asyncIterator](); });
                    results = [];
                    count = asyncIterators.length;
                    never = new Promise(function () { });
                    nextPromises = asyncIterators.map(getNext);
                    _f.label = 1;
                case 1:
                    _f.trys.push([1, , 9, 10]);
                    _f.label = 2;
                case 2:
                    if (!count) return [3 /*break*/, 8];
                    return [4 /*yield*/, __await(Promise.race(nextPromises))];
                case 3:
                    _a = _f.sent(), index = _a.index, result = _a.result;
                    if (!result.done) return [3 /*break*/, 4];
                    nextPromises[index] = never;
                    results[index] = result.value;
                    count--;
                    return [3 /*break*/, 7];
                case 4:
                    nextPromises[index] = getNext(asyncIterators[index], index);
                    return [4 /*yield*/, __await(result.value)];
                case 5: return [4 /*yield*/, _f.sent()];
                case 6:
                    _f.sent();
                    _f.label = 7;
                case 7: return [3 /*break*/, 2];
                case 8: return [3 /*break*/, 10];
                case 9:
                    try {
                        for (_b = __values(asyncIterators.entries()), _c = _b.next(); !_c.done; _c = _b.next()) {
                            _d = __read(_c.value, 2), index = _d[0], iterator = _d[1];
                            if (nextPromises[index] != never && iterator.return != null)
                                iterator.return();
                        }
                    }
                    catch (e_2_1) { e_2 = { error: e_2_1 }; }
                    finally {
                        try {
                            if (_c && !_c.done && (_e = _b.return)) _e.call(_b);
                        }
                        finally { if (e_2) throw e_2.error; }
                    }
                    return [7 /*endfinally*/];
                case 10: return [4 /*yield*/, __await(results)];
                case 11: return [2 /*return*/, _f.sent()];
            }
        });
    });
}
exports.combineAsyncIterable = combineAsyncIterable;
function intersectAsyncIterable(iterable) {
    return __asyncGenerator(this, arguments, function intersectAsyncIterable_1() {
        function getNext(asyncIterator, index) {
            return asyncIterator.next().then(function (result) { return ({
                index: index,
                result: result,
            }); });
        }
        var asyncIterators, results, count, combineResults, never, nextPromises, _loop_1, _a, _b, _c, index, iterator;
        var e_3, _d;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    asyncIterators = Array.from(iterable, function (o) { return o[Symbol.asyncIterator](); });
                    results = [];
                    count = asyncIterators.length;
                    combineResults = new Map(new Array(count)
                        .fill(undefined)
                        .map(function (_, i) { return ([i, new Set()]); }));
                    never = new Promise(function () { });
                    nextPromises = asyncIterators.map(getNext);
                    _e.label = 1;
                case 1:
                    _e.trys.push([1, , 5, 6]);
                    _loop_1 = function () {
                        var _f, index, result, combineResult;
                        return __generator(this, function (_g) {
                            switch (_g.label) {
                                case 0: return [4 /*yield*/, __await(Promise.race(nextPromises))];
                                case 1:
                                    _f = _g.sent(), index = _f.index, result = _f.result;
                                    if (!result.done) return [3 /*break*/, 2];
                                    nextPromises[index] = never;
                                    results[index] = result.value; //what's return is question
                                    count--;
                                    return [3 /*break*/, 6];
                                case 2:
                                    combineResult = combineResults.get(index) || new Set();
                                    combineResult.add(result.value);
                                    combineResults.set(index, combineResult);
                                    if (!__spreadArray([], __read(combineResults.values())).every(function (c) { return c.has(result.value); })) return [3 /*break*/, 5];
                                    __spreadArray([], __read(combineResults.values())).forEach(function (c) { return c.delete(result.value); });
                                    return [4 /*yield*/, __await(result.value)];
                                case 3: return [4 /*yield*/, _g.sent()];
                                case 4:
                                    _g.sent();
                                    _g.label = 5;
                                case 5:
                                    nextPromises[index] = getNext(asyncIterators[index], index);
                                    _g.label = 6;
                                case 6: return [2 /*return*/];
                            }
                        });
                    };
                    _e.label = 2;
                case 2:
                    if (!count) return [3 /*break*/, 4];
                    return [5 /*yield**/, _loop_1()];
                case 3:
                    _e.sent();
                    return [3 /*break*/, 2];
                case 4: return [3 /*break*/, 6];
                case 5:
                    try {
                        for (_a = __values(asyncIterators.entries()), _b = _a.next(); !_b.done; _b = _a.next()) {
                            _c = __read(_b.value, 2), index = _c[0], iterator = _c[1];
                            if (nextPromises[index] != never && iterator.return != null)
                                iterator.return();
                        }
                    }
                    catch (e_3_1) { e_3 = { error: e_3_1 }; }
                    finally {
                        try {
                            if (_b && !_b.done && (_d = _a.return)) _d.call(_a);
                        }
                        finally { if (e_3) throw e_3.error; }
                    }
                    return [7 /*endfinally*/];
                case 6: return [4 /*yield*/, __await(results)];
                case 7: return [2 /*return*/, _e.sent()];
            }
        });
    });
}
exports.intersectAsyncIterable = intersectAsyncIterable;
//# sourceMappingURL=utils.js.map