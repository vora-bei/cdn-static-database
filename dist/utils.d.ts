export declare function getNext<R extends unknown>(asyncIterator: AsyncIterator<R[], unknown, unknown>, index: number): Promise<{
    index: number;
    result: IteratorResult<R[], unknown>;
}>;
export declare function combineAsyncIterable(iterable: AsyncIterable<unknown[]>[]): AsyncGenerator<unknown[], unknown[], unknown>;
export declare function intersectAsyncIterable(iterable: AsyncIterable<unknown[]>[]): AsyncGenerator<unknown[], unknown[], unknown>;
//# sourceMappingURL=utils.d.ts.map