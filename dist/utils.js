"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.intersectAsyncIterable = exports.combineAsyncIterable = void 0;
function getNext(asyncIterator, index) {
    return asyncIterator.next().then(result => ({
        index,
        result,
    }));
}
const never = new Promise(() => { });
async function* combineAsyncIterable(iterable) {
    const asyncIterators = Array.from(iterable, o => o[Symbol.asyncIterator]());
    const results = [];
    let count = asyncIterators.length;
    const nextPromises = asyncIterators.map(getNext);
    try {
        while (count) {
            const { index, result } = await Promise.race(nextPromises);
            if (result.done) {
                nextPromises[index] = never;
                results[index] = result.value;
                count--;
            }
            else {
                nextPromises[index] = getNext(asyncIterators[index], index);
                yield result.value;
            }
        }
    }
    finally {
        for (const [index, iterator] of asyncIterators.entries())
            if (nextPromises[index] != never && iterator.return != null)
                iterator.return();
        // no await here - see https://github.com/tc39/proposal-async-iteration/issues/126
    }
    return results;
}
exports.combineAsyncIterable = combineAsyncIterable;
async function* intersectAsyncIterable(iterable) {
    const asyncIterators = Array.from(iterable, o => o[Symbol.asyncIterator]());
    const results = [];
    let count = asyncIterators.length;
    const combineResults = new Map(new Array(count)
        .fill(undefined)
        .map((_, i) => ([i, new Set()])));
    const nextPromises = asyncIterators.map(getNext);
    try {
        while (count) {
            const { index, result } = await Promise.race(nextPromises);
            if (result.done) {
                nextPromises[index] = never;
                results[index] = result.value; //what's return is question
                count--;
            }
            else {
                const combineResult = combineResults.get(index);
                nextPromises[index] = getNext(asyncIterators[index], index);
                let subResults = [];
                for (let v of result.value) {
                    combineResult.add(v);
                    if ([...combineResults.values()].every(c => c.has(v))) {
                        [...combineResults.values()].forEach(c => c.delete(v));
                        subResults.push(v);
                    }
                }
                yield subResults;
            }
        }
    }
    finally {
        for (const [index, iterator] of asyncIterators.entries())
            if (nextPromises[index] != never && iterator.return != null)
                iterator.return();
        // no await here - see https://github.com/tc39/proposal-async-iteration/issues/126
    }
    return results;
}
exports.intersectAsyncIterable = intersectAsyncIterable;
//# sourceMappingURL=utils.js.map