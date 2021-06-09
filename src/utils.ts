import fs from "fs";
import util from "util";
import { ISharedIndice, ISpreadIndice } from "interfaces";
const writeFile = util.promisify(fs.writeFile);
const readFile = util.promisify(fs.readFile);

const mkdir = util.promisify(fs.mkdir);
const exists = util.promisify(fs.exists);

export const saveSharedIndeces = async <T, P>(indice: ISharedIndice<T, P>) => {
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
    id: string,
    deserializeShared: (
        data: any,
        options: any,
        deserialize: (data: any, options?: any) => ISpreadIndice<T, P>) => ISharedIndice<T, P>,
    deserialize: (
        data: any,
        options?: any
    ) => ISpreadIndice<T, P>

) => {
    const load = async (options: { id }) => {
        await new Promise((res) => setTimeout(res, 200))
        console.debug("load")
        return JSON.parse((await readFile(`./${id}/chunk_${options.id}.json`)).toString())
    }
    const jsonRaw = await readFile(`./${id}/index.json`);
    const json: { data: [any, any][], options: any } = JSON.parse(jsonRaw.toString());
    return deserializeShared(
        json.data,
        json.options,
        (options) => deserialize({ ...options, load }));
}