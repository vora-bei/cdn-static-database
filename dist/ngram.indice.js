"use strict";
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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
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
exports.NgramIndice = void 0;
var n_gram_1 = __importDefault(require("n-gram"));
var CHUNK_SIZE_DEFAULT = 100;
var AUTO_LIMIT_FIND_PERCENT = 40;
var id_counter = 1;
var NgramIndice = /** @class */ (function () {
    function NgramIndice(_a) {
        var _b = _a === void 0 ? {} : _a, _c = _b.id, id = _c === void 0 ? "" + id_counter++ : _c, _d = _b.gramLen, gramLen = _d === void 0 ? 3 : _d, _e = _b.actuationLimit, actuationLimit = _e === void 0 ? 2 : _e, _f = _b.toLowcase, toLowcase = _f === void 0 ? true : _f, _g = _b.actuationLimitAuto, actuationLimitAuto = _g === void 0 ? false : _g, _h = _b.isLoaded, isLoaded = _h === void 0 ? true : _h, load = _b.load;
        this.indices = new Map();
        this.nGram = n_gram_1.default(gramLen);
        this.options = {
            gramLen: gramLen,
            actuationLimit: actuationLimit,
            toLowcase: toLowcase,
            actuationLimitAuto: actuationLimitAuto,
            isLoaded: isLoaded,
            id: id,
            load: load
        };
        return this;
    }
    Object.defineProperty(NgramIndice.prototype, "keys", {
        get: function () {
            var keys = __spreadArray([], __read(this.indices.keys()));
            keys.sort(function (a, b) {
                if (a === b) {
                    return 0;
                }
                return a < b ? -1 : 1;
            });
            return keys;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(NgramIndice.prototype, "id", {
        get: function () {
            return this.options.id;
        },
        enumerable: false,
        configurable: true
    });
    NgramIndice.prototype.add = function (key, value) {
        var _this = this;
        var tokens = [];
        if (Array.isArray(value)) {
            value.forEach(function (v) { return tokens.push.apply(tokens, __spreadArray([], __read(_this.tokenizr(v)))); });
        }
        else {
            tokens.push.apply(tokens, __spreadArray([], __read(this.tokenizr(value))));
        }
        tokens.forEach(function (token) {
            var index = _this.indices.get(token) || [];
            index.push(key);
            _this.indices.set(token, index);
        });
    };
    NgramIndice.prototype.serializeOptions = function () {
        var _a = this.options, load = _a.load, options = __rest(_a, ["load"]);
        return options;
    };
    NgramIndice.prototype.serializeData = function () {
        return __spreadArray([], __read(this.indices));
    };
    NgramIndice.prototype.tokenizr = function (value) {
        var _this = this;
        var _a = this.options, preTokenizr = _a.preTokenizr, postTokenizr = _a.postTokenizr;
        var v = preTokenizr ? preTokenizr(value) : value;
        v = this.options.toLowcase ? v.toLowerCase() : v;
        var tokens = v.split(" ").flatMap(function (word) { return _this.nGram(word); });
        return postTokenizr ? postTokenizr(value, tokens) : tokens;
    };
    NgramIndice.prototype.load = function () {
        return __awaiter(this, void 0, void 0, function () {
            var data;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.options.isLoaded) return [3 /*break*/, 1];
                        return [2 /*return*/];
                    case 1:
                        if (!this.options.load) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.options.load(this.options)];
                    case 2:
                        data = (_a.sent()).data;
                        this.indices = new Map(data);
                        this.options.isLoaded = true;
                        return [3 /*break*/, 4];
                    case 3: throw (Error("option load doesn't implemented"));
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    NgramIndice.prototype.getIndices = function (token, operator) {
        return this.indices.get(token);
    };
    NgramIndice.prototype.preFilter = function (tokens, operator) {
        if (operator === void 0) { operator = "$eq"; }
        return __awaiter(this, void 0, void 0, function () {
            var countResults;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        countResults = new Map();
                        return [4 /*yield*/, this.load()];
                    case 1:
                        _a.sent();
                        tokens.forEach(function (token) {
                            var indices = _this.getIndices(token, operator);
                            if (indices) {
                                indices.forEach(function (id) {
                                    var count = countResults.get(id) || 0;
                                    countResults.set(id, count + 1);
                                });
                            }
                        });
                        return [2 /*return*/, countResults];
                }
            });
        });
    };
    NgramIndice.prototype.find = function (value, operator) {
        if (operator === void 0) { operator = "$eq"; }
        return __awaiter(this, void 0, void 0, function () {
            var tokens, preResult;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        tokens = [];
                        if (value !== undefined) {
                            tokens = Array.isArray(value) ? value.flatMap(function (v) { return _this.tokenizr(v); }) : this.tokenizr(value);
                        }
                        return [4 /*yield*/, this.preFilter(tokens, operator)];
                    case 1:
                        preResult = _a.sent();
                        return [2 /*return*/, this.postFilter(preResult, tokens)];
                }
            });
        });
    };
    NgramIndice.prototype.postFilter = function (countResults, tokens) {
        var _a = this.options, actuationLimitAuto = _a.actuationLimitAuto, actuationLimit = _a.actuationLimit;
        var l = this.getLimit(actuationLimitAuto, tokens.length, actuationLimit);
        var results = __spreadArray([], __read(countResults.entries())).filter(function (_a) {
            var _b = __read(_a, 2), _ = _b[0], count = _b[1];
            return count >= l;
        })
            .map(function (_a) {
            var _b = __read(_a, 1), id = _b[0];
            return id;
        });
        return results;
    };
    NgramIndice.prototype.getLimit = function (autoLimit, tokensLength, limit) {
        return autoLimit ? tokensLength * AUTO_LIMIT_FIND_PERCENT / 100 : limit;
    };
    NgramIndice.prototype.serialize = function () {
        return { data: this.serializeData(), options: this.serializeOptions() };
    };
    NgramIndice.deserialize = function (data, options) {
        if (!options) {
            options = data;
            data = null;
        }
        var index = new NgramIndice(options);
        if (!!data) {
            index.indices = data;
        }
        return index;
    };
    NgramIndice.prototype.spread = function (chunkSize) {
        var _this = this;
        if (chunkSize === void 0) { chunkSize = CHUNK_SIZE_DEFAULT; }
        var _a = this.options, id = _a.id, options = __rest(_a, ["id"]);
        var result = [];
        var size = 0;
        var map = new Map();
        this.keys.forEach(function (key) {
            var value = _this.indices.get(key);
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
    };
    NgramIndice.prototype.findAll = function (indices, value, operator) {
        if (operator === void 0) { operator = '$eq'; }
        return __awaiter(this, void 0, void 0, function () {
            var tokens, list, combineWeights;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        tokens = Array.isArray(value) ? value.flatMap(function (v) { return _this.tokenizr(v); }) : this.tokenizr(value);
                        return [4 /*yield*/, Promise.all(indices.map(function (indice) { return indice.preFilter(tokens, operator); }))];
                    case 1:
                        list = _a.sent();
                        combineWeights = list.reduce(function (sum, weights) {
                            weights.forEach(function (value, key) {
                                var count = sum.get(key) || 0;
                                sum.set(key, count + value);
                            });
                            return sum;
                        }, new Map());
                        return [2 /*return*/, this.postFilter(combineWeights, tokens)];
                }
            });
        });
    };
    NgramIndice.prototype.cursorAll = function (indices, value, operator) {
        var _a;
        var _this = this;
        if (operator === void 0) { operator = '$eq'; }
        var tokens = Array.isArray(value) ? value.flatMap(function (v) { return _this.tokenizr(v); }) : this.tokenizr(value);
        var list$ = Promise.all(indices.map(function (indice) { return indice.preFilter(tokens, operator); }));
        var isLoad = false;
        var index = 0;
        var self = this;
        var result;
        var load = function () { return __awaiter(_this, void 0, void 0, function () {
            var list, combineWeights;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (isLoad) {
                            return [2 /*return*/];
                        }
                        return [4 /*yield*/, list$];
                    case 1:
                        list = _a.sent();
                        combineWeights = list.reduce(function (sum, weights) {
                            weights.forEach(function (value, key) {
                                var count = sum.get(key) || 0;
                                sum.set(key, count + value);
                            });
                            return sum;
                        }, new Map());
                        result = self.postFilter(combineWeights, tokens);
                        return [2 /*return*/];
                }
            });
        }); };
        return _a = {},
            _a[Symbol.asyncIterator] = function () {
                return {
                    next: function () {
                        return __awaiter(this, void 0, void 0, function () {
                            var value_1;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, load()];
                                    case 1:
                                        _a.sent();
                                        if (index < result.length) {
                                            value_1 = result[index];
                                            index++;
                                            return [2 /*return*/, { done: false, value: value_1 }];
                                        }
                                        else {
                                            return [2 /*return*/, { done: true, value: undefined }];
                                        }
                                        return [2 /*return*/];
                                }
                            });
                        });
                    }
                };
            },
            _a;
    };
    NgramIndice.prototype.cursor = function (value, operator) {
        var _a;
        var load$ = this.load();
        var result$ = this.find(value, operator);
        var index = 0;
        return _a = {},
            _a[Symbol.asyncIterator] = function () {
                return {
                    next: function () {
                        return __awaiter(this, void 0, void 0, function () {
                            var result, value_2;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, load$];
                                    case 1:
                                        _a.sent();
                                        return [4 /*yield*/, result$];
                                    case 2:
                                        result = _a.sent();
                                        if (index < result.length) {
                                            value_2 = result[index];
                                            index++;
                                            return [2 /*return*/, { done: false, value: value_2 }];
                                        }
                                        else {
                                            return [2 /*return*/, { done: true, value: undefined }];
                                        }
                                        return [2 /*return*/];
                                }
                            });
                        });
                    }
                };
            },
            _a;
    };
    return NgramIndice;
}());
exports.NgramIndice = NgramIndice;
//# sourceMappingURL=ngram.indice.js.map