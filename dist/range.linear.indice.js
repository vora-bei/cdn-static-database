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
exports.RangeLinearIndice = void 0;
var range_1 = require("./range");
var DEFAULT_CHUNK_ZIZE = 2000;
var id_counter = 1;
var RangeLinearIndice = /** @class */ (function () {
    function RangeLinearIndice(_a) {
        var indice = _a.indice, _b = _a.chunkSize, chunkSize = _b === void 0 ? DEFAULT_CHUNK_ZIZE : _b, _c = _a.id, id = _c === void 0 ? "" + id_counter++ : _c;
        this.indices = new Map();
        if (indice) {
            this.indice = indice;
            this.indices = new Map(indice.spread(chunkSize).map(function (indice) { return [range_1.Range.fromKeys(indice.keys), indice]; }));
        }
        this.options = { id: id };
    }
    Object.defineProperty(RangeLinearIndice.prototype, "id", {
        get: function () {
            return this.options.id;
        },
        enumerable: false,
        configurable: true
    });
    RangeLinearIndice.prototype.serialize = function () {
        return { data: this.serializeData(), options: this.serializeOptions() };
    };
    RangeLinearIndice.prototype.serializeData = function () {
        return __spreadArray([], __read(this.indices)).map(function (_a, i) {
            var _b = __read(_a, 2), filter = _b[0], indice = _b[1];
            return ([[filter.left, filter.right], indice.id]);
        });
    };
    RangeLinearIndice.prototype.serializeOptions = function () {
        var _a;
        return { self: __assign({}, this.options), spread: __assign(__assign({}, (_a = this.indice) === null || _a === void 0 ? void 0 : _a.serializeOptions()), { isLoaded: false }) };
    };
    RangeLinearIndice.deserialize = function (data, options, deserialize) {
        var indices = new Map(data.map(function (_a) {
            var _b = __read(_a, 2), _c = __read(_b[0], 2), left = _c[0], right = _c[1], id = _b[1];
            return [new range_1.Range(left, right), deserialize(__assign(__assign({}, options.spread), { id: id }))];
        }));
        var indice = new RangeLinearIndice(__assign({}, options.self));
        indice.indices = indices;
        indice.indice = deserialize(__assign({}, options.spread));
        return indice;
    };
    RangeLinearIndice.prototype.find = function (value) {
        return __awaiter(this, void 0, void 0, function () {
            var tokens, weights;
            return __generator(this, function (_a) {
                if (!this.indice) {
                    throw new Error("Spread indice doesn't initialized");
                }
                tokens = this.indice.tokenizr(value);
                weights = __spreadArray([], __read(this.indices)).map(function (_a) {
                    var _b = __read(_a, 2), filter = _b[0], indice = _b[1];
                    var width = tokens.reduce(function (w, token) { return filter.has(token) ? 1 + w : w; }, 0);
                    return [width, indice];
                }).filter(function (_a) {
                    var _b = __read(_a, 1), width = _b[0];
                    return !!width;
                })
                    .map(function (_a) {
                    var _b = __read(_a, 2), _ = _b[0], indice = _b[1];
                    return indice;
                });
                return [2 /*return*/, this.indice.findAll(weights, value)];
            });
        });
    };
    return RangeLinearIndice;
}());
exports.RangeLinearIndice = RangeLinearIndice;
//# sourceMappingURL=range.linear.indice.js.map