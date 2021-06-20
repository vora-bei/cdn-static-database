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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var range_linear_indice_1 = require("../range.linear.indice");
var ngram_indice_1 = require("../ngram.indice");
var country_by_continent_json_1 = __importDefault(require("./country-by-continent.json"));
var utils_1 = require("../utils");
var simple_indice_1 = require("../simple.indice");
var db_1 = require("db");
var schema_1 = require("schema");
var indices = new ngram_indice_1.NgramIndice({ gramLen: 3, actuationLimit: 2, toLowcase: true, actuationLimitAuto: true, isLoaded: false });
country_by_continent_json_1.default.forEach(function (country, key) { return indices.add(key, [country.country, country.continent]); });
var range = new range_linear_indice_1.RangeLinearIndice({ indice: indices, id: 'text' });
var primaryIndices = new simple_indice_1.SimpleIndice({ isLoaded: false });
country_by_continent_json_1.default.forEach(function (country, key) { return primaryIndices.add(key, country); });
var primaryRange = new range_linear_indice_1.RangeLinearIndice({ indice: primaryIndices, id: 'primary' });
var simplaeIndices = new simple_indice_1.SimpleIndice({ isLoaded: false });
country_by_continent_json_1.default.forEach(function (country, key) { return simplaeIndices.add(key, country.continent); });
var simpleRange = new range_linear_indice_1.RangeLinearIndice({ indice: simplaeIndices, id: 'simple' });
Promise.all([
    utils_1.saveSharedIndices(range),
    utils_1.saveSharedIndices(primaryRange),
    utils_1.saveSharedIndices(simpleRange)
]).then(function () { return Promise.all([
    utils_1.restoreSharedIndices("primary", range_linear_indice_1.RangeLinearIndice.deserialize, simple_indice_1.SimpleIndice.deserialize),
    utils_1.restoreSharedIndices("text", range_linear_indice_1.RangeLinearIndice.deserialize, ngram_indice_1.NgramIndice.deserialize),
    utils_1.restoreSharedIndices("simple", range_linear_indice_1.RangeLinearIndice.deserialize, simple_indice_1.SimpleIndice.deserialize),
]); })
    .then(function (_a) {
    var _b = __read(_a, 3), primary = _b[0], text = _b[1], simple = _b[2];
    return __awaiter(void 0, void 0, void 0, function () {
        var contries, _c, _d, _e, _f;
        return __generator(this, function (_g) {
            switch (_g.label) {
                case 0:
                    contries = new db_1.Db(new schema_1.Schema(primary, [
                        { indice: text, type: schema_1.IndiceType.GLOBAL },
                        { indice: simple, path: 'continent', type: schema_1.IndiceType.LOCAL }
                    ]));
                    _d = (_c = console).log;
                    return [4 /*yield*/, contries.find({ 'continent': { '$eq': "Oceania" } }, undefined, 0, 20)];
                case 1:
                    _d.apply(_c, [_g.sent()]);
                    _f = (_e = console).log;
                    return [4 /*yield*/, contries.find({ '$text': "Angola" }, undefined, 0, 20)];
                case 2:
                    _f.apply(_e, [_g.sent()]);
                    return [2 /*return*/];
            }
        });
    });
});
//# sourceMappingURL=index.auto.limit.test.js.map