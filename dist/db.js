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
var __spreadArray = (this && this.__spreadArray) || function (to, from) {
    for (var i = 0, il = from.length, j = to.length; i < il; i++, j++)
        to[j] = from[i];
    return to;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Db = void 0;
var mingo_1 = __importDefault(require("mingo"));
var core_1 = require("mingo/core");
var util_1 = require("mingo/util");
var schema_1 = require("./schema");
core_1.addOperators(core_1.OperatorType.QUERY, function () { return ({ "$text": function () { return true; } }); });
var comparableOperators = new Set([
    '$eq', '$gt', '$gte', '$in', '$lt', '$lte', '$ne', '$nin'
]);
var logicalOperators = new Set([
    '$and', '$or'
]);
var Db = /** @class */ (function () {
    function Db(schema) {
        this.schema = schema;
    }
    Db.prototype.buildIndexSearch = function (criteria, sort, context) {
        var e_1, _a;
        var _this = this;
        var indices = [];
        var subCriterias = [];
        var _loop_1 = function (key, value) {
            var path = (context === null || context === void 0 ? void 0 : context.path) || undefined;
            if (logicalOperators.has(key) && util_1.isArray(value)) {
                var logSubCriterias_1 = value
                    .map(function (subCriteria) { return _this.buildIndexSearch(subCriteria, sort); });
                subCriterias.push(function () { return __awaiter(_this, void 0, void 0, function () {
                    var ids, result;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, Promise.all(logSubCriterias_1.map(function (callback) { return callback(); }))];
                            case 1:
                                ids = _a.sent();
                                result = ids[0];
                                ids.forEach(function (subres) {
                                    if (key === '$and') {
                                        result = util_1.intersection(result, subres);
                                    }
                                    else {
                                        result.push(subres);
                                    }
                                });
                                return [2 /*return*/, result];
                        }
                    });
                }); });
            }
            else if (key === '$text') {
                var fullTextIndice = this_1.schema
                    .indices
                    .filter(function (i) { return i.type === schema_1.IndiceType.GLOBAL && criteria['$text']; })
                    .pop();
                if (fullTextIndice) {
                    indices.push(__assign(__assign({}, fullTextIndice), { value: value }));
                }
                delete criteria['$text'];
            }
            else if (util_1.isOperator(key)) {
                var indice = this_1.schema.indices.find(function (o) { return o.path === path; });
                console.debug(key, path, indice);
                if (indice) {
                    indices.push(__assign(__assign({}, indice), { value: value, op: key }));
                }
            }
            else if (util_1.isObject(value)) {
                subCriterias.push(this_1.buildIndexSearch(value, sort, { path: key }));
            }
            else if (util_1.isObject(value)) {
                subCriterias.push(this_1.buildIndexSearch(value, sort, { path: key }));
            }
            else {
                var indice = this_1.schema.indices.find(function (o) { return o.path === key; });
                console.debug(key, path, indice);
                if (indice) {
                    indices.push(__assign(__assign({}, indice), { value: value, op: '$eq' }));
                }
            }
        };
        var this_1 = this;
        try {
            for (var _b = __values(Object.entries(criteria)), _c = _b.next(); !_c.done; _c = _b.next()) {
                var _d = __read(_c.value, 2), key = _d[0], value = _d[1];
                _loop_1(key, value);
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_1) throw e_1.error; }
        }
        return function () { return __awaiter(_this, void 0, void 0, function () {
            var ids, ids2, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, Promise.all(indices.map(function (_a) {
                            var indice = _a.indice, op = _a.op, value = _a.value;
                            return indice.find(value, op);
                        }))];
                    case 1:
                        ids = _a.sent();
                        return [4 /*yield*/, Promise.all(subCriterias.map(function (subCriteria) { return subCriteria(); }))];
                    case 2:
                        ids2 = _a.sent();
                        ids.push.apply(ids, __spreadArray([], __read(ids2)));
                        result = ids[0];
                        ids.forEach(function (subres) {
                            result = util_1.intersection(result, subres);
                        });
                        return [2 /*return*/, result];
                }
            });
        }); };
    };
    Db.prototype.find = function (criteria, sort, skip, limit) {
        var e_2, _a;
        if (skip === void 0) { skip = 0; }
        return __awaiter(this, void 0, void 0, function () {
            var primaryIndice, searchIds, load, cursor, result, query, i, cursor_1, cursor_1_1, value, e_2_1;
            var _this = this;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        primaryIndice = this.schema.primaryIndice;
                        searchIds = this.buildIndexSearch(criteria, sort);
                        load = function () { return __awaiter(_this, void 0, void 0, function () {
                            var ids;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        if (!searchIds) return [3 /*break*/, 2];
                                        return [4 /*yield*/, searchIds()];
                                    case 1:
                                        ids = _a.sent();
                                        _a.label = 2;
                                    case 2: return [2 /*return*/, primaryIndice.cursor(ids)];
                                }
                            });
                        }); };
                        return [4 /*yield*/, load()];
                    case 1:
                        cursor = _b.sent();
                        result = [];
                        query = new mingo_1.default.Query(criteria);
                        i = 0;
                        _b.label = 2;
                    case 2:
                        _b.trys.push([2, 7, 8, 13]);
                        cursor_1 = __asyncValues(cursor);
                        _b.label = 3;
                    case 3: return [4 /*yield*/, cursor_1.next()];
                    case 4:
                        if (!(cursor_1_1 = _b.sent(), !cursor_1_1.done)) return [3 /*break*/, 6];
                        value = cursor_1_1.value;
                        console.log(value);
                        if (query.test(value) && i >= skip) {
                            i++;
                            result.push(value);
                            if (limit && i === limit) {
                                return [3 /*break*/, 6];
                            }
                        }
                        _b.label = 5;
                    case 5: return [3 /*break*/, 3];
                    case 6: return [3 /*break*/, 13];
                    case 7:
                        e_2_1 = _b.sent();
                        e_2 = { error: e_2_1 };
                        return [3 /*break*/, 13];
                    case 8:
                        _b.trys.push([8, , 11, 12]);
                        if (!(cursor_1_1 && !cursor_1_1.done && (_a = cursor_1.return))) return [3 /*break*/, 10];
                        return [4 /*yield*/, _a.call(cursor_1)];
                    case 9:
                        _b.sent();
                        _b.label = 10;
                    case 10: return [3 /*break*/, 12];
                    case 11:
                        if (e_2) throw e_2.error;
                        return [7 /*endfinally*/];
                    case 12: return [7 /*endfinally*/];
                    case 13: return [2 /*return*/, result];
                }
            });
        });
    };
    return Db;
}());
exports.Db = Db;
//# sourceMappingURL=db.js.map