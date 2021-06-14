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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SimpleIndice = void 0;
var CHUNK_SIZE_DEFAULT = 100;
var id_counter = 1;
var SimpleIndice = /** @class */ (function () {
    function SimpleIndice(_a) {
        var _b = _a === void 0 ? {} : _a, _c = _b.id, id = _c === void 0 ? "" + id_counter++ : _c, _d = _b.isLoaded, isLoaded = _d === void 0 ? true : _d, load = _b.load;
        this.indices = new Map();
        this.options = {
            isLoaded: isLoaded,
            id: id,
            load: load
        };
        return this;
    }
    Object.defineProperty(SimpleIndice.prototype, "keys", {
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
    Object.defineProperty(SimpleIndice.prototype, "id", {
        get: function () {
            return this.options.id;
        },
        enumerable: false,
        configurable: true
    });
    SimpleIndice.prototype.add = function (key, value) {
        var _this = this;
        var tokens = [];
        if (Array.isArray(value)) {
            tokens.push.apply(tokens, __spreadArray([], __read(value)));
        }
        else {
            tokens.push(value);
        }
        tokens.forEach(function (token) {
            var indice = _this.indices.get(token) || [];
            indice.push(key);
            _this.indices.set(token, indice);
        });
    };
    SimpleIndice.prototype.serializeOptions = function () {
        var _a = this.options, load = _a.load, options = __rest(_a, ["load"]);
        return options;
    };
    SimpleIndice.prototype.serializeData = function () {
        return __spreadArray([], __read(this.indices));
    };
    SimpleIndice.prototype.tokenizr = function (value) {
        return [value];
    };
    SimpleIndice.prototype.load = function () {
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
    SimpleIndice.prototype.preFilter = function (tokens) {
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
                            var indices = _this.indices.get(token);
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
    SimpleIndice.prototype.find = function (value) {
        return __awaiter(this, void 0, void 0, function () {
            var tokenizr, tokens, preResult;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        tokenizr = this.tokenizr;
                        tokens = Array.isArray(value) ? value.flatMap(function (v) { return tokenizr(v); }) : tokenizr(value);
                        return [4 /*yield*/, this.preFilter(tokens)];
                    case 1:
                        preResult = _a.sent();
                        return [2 /*return*/, this.postFilter(preResult, tokens)];
                }
            });
        });
    };
    SimpleIndice.prototype.postFilter = function (countResults, tokens) {
        var results = __spreadArray([], __read(countResults.entries())).map(function (_a) {
            var _b = __read(_a, 1), id = _b[0];
            return id;
        });
        return results;
    };
    SimpleIndice.prototype.serialize = function () {
        return { data: this.serializeData(), options: this.serializeOptions() };
    };
    SimpleIndice.deserialize = function (data, options) {
        if (!options) {
            options = data;
            data = null;
        }
        var index = new SimpleIndice(options);
        if (!!data) {
            index.indices = data;
        }
        return index;
    };
    SimpleIndice.prototype.spread = function (chunkSize) {
        var _this = this;
        if (chunkSize === void 0) { chunkSize = CHUNK_SIZE_DEFAULT; }
        var _a = this.options, id = _a.id, options = __rest(_a, ["id"]);
        var result = [];
        var size = 0;
        var map = new Map();
        this.keys.forEach(function (key) {
            var value = _this.indices.get(key);
            if (size > chunkSize) {
                result.push(SimpleIndice.deserialize(map, options));
                size = 0;
                map = new Map();
            }
            else {
                size = size + 1;
                map.set(key, value);
            }
        });
        if (size != 0) {
            result.push(SimpleIndice.deserialize(map, options));
        }
        return result;
    };
    SimpleIndice.prototype.findAll = function (indices, value) {
        return __awaiter(this, void 0, void 0, function () {
            var tokenizr, tokens, list, combineWeights;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        tokenizr = this.tokenizr;
                        tokens = Array.isArray(value) ? value.flatMap(function (v) { return tokenizr(v); }) : tokenizr(value);
                        return [4 /*yield*/, Promise.all(indices.map(function (indice) { return indice.preFilter(tokens); }))];
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
    return SimpleIndice;
}());
exports.SimpleIndice = SimpleIndice;
//# sourceMappingURL=simple.indice.js.map