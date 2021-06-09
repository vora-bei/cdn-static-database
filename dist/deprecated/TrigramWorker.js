"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var Trigram_1 = __importDefault(require("./Trigram"));
onmessage = function (e) {
    postMessage(Trigram_1.default(e.data));
};
