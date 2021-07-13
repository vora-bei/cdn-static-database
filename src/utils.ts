
 function getNext(asyncIterator: AsyncIterator<any[]>, index) {
    return asyncIterator.next().then(result => ({
        index,
        result,
    }));
}
const never:  Promise<{
    index: any;
    result: IteratorResult< any[], any>;
}> = new Promise(() => { });

export async function* combineAsyncIterable(iterable: AsyncIterable<any[]>[]) {
    const asyncIterators = Array.from(iterable, o => o[Symbol.asyncIterator]());
    const results: any[] = [];
    let count = asyncIterators.length;
   
    const nextPromises: Promise<{
        index: any;
        result: IteratorResult<any[], any>;
    }>[] = asyncIterators.map(getNext);
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

export async function* intersectAsyncIterable(iterable: AsyncIterable<any[]>[]) {
    const asyncIterators = Array.from(iterable, o => o[Symbol.asyncIterator]());
    const results: any[] = [];
    let count = asyncIterators.length;
    const combineResults: Map<number, Set<any>> = new Map(
        new Array(count)
            .fill(undefined)
            .map((_, i) => ([i, new Set()]))
    );
    const nextPromises = asyncIterators.map(getNext);
    try {
        while (count) {
            const { index, result } = await Promise.race(nextPromises);
            if (result.done) {
                nextPromises[index] = never;
                results[index] = result.value; //what's return is question
                count--;
            } else {
                const combineResult = combineResults.get(index)!;
                nextPromises[index] = getNext(asyncIterators[index], index);
                let subResults: any[] = [];
                for (let v of result.value) {
                    combineResult.add(v);
                    if(iterable.length === 1){
                        subResults.push(v);
                    } else if ([...combineResults.values()].every(c => c.has(v))) {
                        [...combineResults.values()].forEach(c => c.delete(v));
                        subResults.push(v);
                    }
                }
                if(subResults.length){
                    yield subResults;
                }        
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