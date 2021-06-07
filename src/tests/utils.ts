import { BloomIndex } from "bloom.index";
import fs from "fs";
import util from "util";
import { IIndex } from "interfaces";
import { NgramIndex } from "ngram.index";
const writeFile = util.promisify(fs.writeFile);
const readFile = util.promisify(fs.readFile);

const mkdir = util.promisify(fs.mkdir);
const stat = util.promisify(fs.stat);

export const saveBloomToFiles = async <T>(index: BloomIndex<T>) => {
    const dir = `./${index.id}`;
    const st = await stat(dir);
    if (!st.isDirectory()) {
        await mkdir(dir)
    }
    await writeFile(`./${index.id}/index.json`, JSON.stringify(index.serialize()))
    for (let [_, v] of index.indexes) {
        await writeFile(`./${index.id}/chunk_${v.id}.json`, JSON.stringify(v.serialize()))
    }
}

export const restoreBloom = async (path: string) => {
    const jsonRaw = await readFile(path);
    const json: { data: [any, any][], options: any } = JSON.parse(jsonRaw.toString());
    const data = json.data.map<[any, IIndex<number>]>(([obj, options]) => [obj, NgramIndex
        .deserialize<number>({ ...options, load: async () => JSON.parse((await readFile(`./${json.options.id}/chunk_${options.id}.json`)).toString()) })]);
    return BloomIndex.deserialize(data, json.options);
}