"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.restoreSharedIndices = exports.saveSharedIndices = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = require("path");
const util_1 = __importDefault(require("util"));
const writeFile = util_1.default.promisify(fs_1.default.writeFile);
const readFile = util_1.default.promisify(fs_1.default.readFile);
const mkdir = util_1.default.promisify(fs_1.default.mkdir);
const exists = util_1.default.promisify(fs_1.default.exists);
const saveSharedIndices = async (indice, publicPath = '.') => {
    const dir = path_1.join(publicPath, indice.id);
    const existDir = await exists(dir);
    if (!existDir) {
        await mkdir(dir);
    }
    await writeFile(path_1.join(dir, 'index.json'), JSON.stringify(indice.serialize()));
    for (let [_, v] of indice.indices) {
        await writeFile(path_1.join(dir, `chunk_${v.id}.json`), JSON.stringify({ data: v.serializeData(), options: { id: v.id } }));
    }
};
exports.saveSharedIndices = saveSharedIndices;
const restoreSharedIndices = async (id, deserializeShared, deserialize) => {
    const load = async (options) => {
        console.debug('load', options.id);
        return JSON.parse((await readFile(`./${id}/chunk_${options.id}.json`)).toString());
    };
    const jsonRaw = await readFile(`./${id}/index.json`);
    const json = JSON.parse(jsonRaw.toString());
    return deserializeShared(json.data, json.options, (options) => deserialize({ ...options, load }));
};
exports.restoreSharedIndices = restoreSharedIndices;
//# sourceMappingURL=utils.ssr.js.map