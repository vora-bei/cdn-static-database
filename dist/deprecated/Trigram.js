"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var Snowball_1 = __importDefault(require("modules/core/libs/Snowball"));
var result = {};
var stemmer = new Snowball_1.default('Russian');
var asTrigrams = function (phrase, callback) {
    var spl = (phrase || '').toLowerCase().split(' ');
    spl = spl.filter(function (str) {
        return str.length > 1;
    });
    spl.forEach(function (val) {
        stemmer.setCurrent(val);
        stemmer.stem();
        val = stemmer.getCurrent();
        val = " ".concat(val, " ");
        for (var i = val.length - 3; i >= 0; i = i - 1) {
            callback.call(this, val.slice(i, i + 3));
        }
    }, this);
};
var calc = function (data) {
    data.forEach(function (val, key) {
        asTrigrams.call(this, val, function (trigram) {
            var phrasesForTrigram = result[trigram];
            if (!phrasesForTrigram)
                phrasesForTrigram = [];
            if (phrasesForTrigram.indexOf(key) < 0)
                phrasesForTrigram.push(key);
            result[trigram] = phrasesForTrigram;
        });
    });
    return result;
};
exports.default = calc;
