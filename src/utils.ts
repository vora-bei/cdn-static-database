import fs from "fs";
import util from "util";
import { IIndice, ISharedIndice } from "interfaces";
const writeFile = util.promisify(fs.writeFile);
const readFile = util.promisify(fs.readFile);

const mkdir = util.promisify(fs.mkdir);
const exists = util.promisify(fs.exists);

export const  saveSharedIndeces = async <T, P>(indice: ISharedIndice<T, P>) => {
    const dir = `./${indice.id}`;
    const existDir = await exists(dir);
    if (!existDir) {
        await mkdir(dir)
    }
    await writeFile(`./${indice.id}/index.json`, JSON.stringify(indice.serialize()))
    for (let [_, v] of indice.indices) {
        await writeFile(`./${indice.id}/chunk_${v.id}.json`, JSON.stringify(v.serialize()))
    }
}

export const restoreSharedIndeces = async <T, P>(
    path: string,
     deserializeShared: (data: any, options?: any) => ISharedIndice<T, P>,
     deserialize: (data: any, options?: any) => IIndice<T, P>

     ) => {
    const jsonRaw = await readFile(path);
    const json: { data: [any, any][], options: any } = JSON.parse(jsonRaw.toString());
    const data = json.data.map<[any, IIndice<T, P>]>(([obj, options]) => [obj, 
        deserialize({ ...options, load: async () => JSON.parse((await readFile(`./${json.options.id}/chunk_${options.id}.json`)).toString()) })]);
    return deserializeShared(data, json.options);
}