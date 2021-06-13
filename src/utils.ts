import fs from "fs";
import { join, resolve } from "path";
import util from "util";
import { ISharedIndice, ISpreadIndice } from "interfaces";
const writeFile = util.promisify(fs.writeFile);
const readFile = util.promisify(fs.readFile);

const mkdir = util.promisify(fs.mkdir);
const exists = util.promisify(fs.exists);

export const saveSharedIndices = async <T, P>(indice: ISharedIndice<T, P>, publicPath: string= '.') => {
    const dir = join(publicPath, indice.id);
    const existDir = await exists(dir);
    if (!existDir) {
        await mkdir(dir)
    }
    await writeFile(join(dir, 'index.json'), JSON.stringify(indice.serialize()))
    for (let [_, v] of indice.indices) {
        await writeFile(
            join(dir, `chunk_${v.id}.json`),
            JSON.stringify({ data: v.serializeData(), options: { id: v.id } })
        )
    }
}

export const restoreSharedIndices = async <T, P>(
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
        return JSON.parse((await readFile(`./${id}/chunk_${options.id}.json`)).toString())
    }
    const jsonRaw = await readFile(`./${id}/index.json`);
    const json: { data: [any, any][], options: any } = JSON.parse(jsonRaw.toString());
    return deserializeShared(
        json.data,
        json.options,
        (options) => deserialize({ ...options, load }));
}