import fs from "fs";
import { join } from "path";
import util from "util";
import { ISharedIndice, ISpreadIndice } from "./interfaces";
const writeFile = util.promisify(fs.writeFile);
const readFile = util.promisify(fs.readFile);

const mkdir = util.promisify(fs.mkdir);
const exists = util.promisify(fs.exists);

export const saveSharedIndices = async <T, P>(indice: ISharedIndice<T, P>, publicPath: string = '.') => {
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
    ) => ISpreadIndice<T, any>

): Promise<ISharedIndice<T, P>> => {
    const load = async (options: { id }) => {
        console.debug('load', options.id);
        return JSON.parse((await readFile(`./${id}/chunk_${options.id}.json`)).toString())
    }
    const jsonRaw = await readFile(`./${id}/index.json`);
    const json: { data: [any, any][], options: any } = JSON.parse(jsonRaw.toString());
    return deserializeShared(
        json.data,
        json.options,
        (options) => deserialize({ ...options, load }));
}


export async function* combineAsyncIterable(iterable: AsyncIterable<any>[]) {
    const asyncIterators = Array.from(iterable, o => o[Symbol.asyncIterator]());
    const results: any[] = [];
    let count = asyncIterators.length;
    const never = new Promise(() => { });
    function getNext(asyncIterator, index) {
        return asyncIterator.next().then(result => ({
            index,
            result,
        }));
    }
    const nextPromises = asyncIterators.map(getNext);
    try {
        while (count) {
            const { index, result } = await Promise.race(nextPromises);
            if (result.done) {
                nextPromises[index] = never;
                results[index] = result.value;
                count--;
            } else {
                nextPromises[index] = getNext(asyncIterators[index], index);
                yield result.value;
            }
        }
    } finally {
        for (const [index, iterator] of asyncIterators.entries())
            if (nextPromises[index] != never && iterator.return != null)
                iterator.return();
        // no await here - see https://github.com/tc39/proposal-async-iteration/issues/126
    }
    return results;
}

export async function* intersectAsyncIterable(iterable: AsyncIterable<any>[]) {
    const asyncIterators = Array.from(iterable, o => o[Symbol.asyncIterator]());
    const results: any[] = [];

    let count = asyncIterators.length;
    const combineResults: Map<number, Set<any>> = new Map(
        new Array(count)
            .fill(undefined)
            .map((_, i) => ([i, new Set()]))
    );
    const never = new Promise(() => { });
    function getNext(asyncIterator, index) {
        return asyncIterator.next().then(result => ({
            index,
            result,
        }));
    }
    const nextPromises = asyncIterators.map(getNext);
    try {
        while (count) {
            const { index, result } = await Promise.race(nextPromises);
            if (result.done) {
                nextPromises[index] = never;
                results[index] = result.value; //what's return is question
                count--;
            } else {
                const combineResult = combineResults.get(index) || new Set();
                combineResult.add(result.value);
                combineResults.set(index, combineResult);
                if ([...combineResults.values()].every(c => c.has(result.value))) {
                    [...combineResults.values()].forEach(c => c.delete(result.value))
                    yield result.value;
                }
                nextPromises[index] = getNext(asyncIterators[index], index);
            }
        }
    } finally {
        for (const [index, iterator] of asyncIterators.entries())
            if (nextPromises[index] != never && iterator.return != null)
                iterator.return();
        // no await here - see https://github.com/tc39/proposal-async-iteration/issues/126
    }
    return results;
}