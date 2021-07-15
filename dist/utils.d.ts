export declare function getNext(asyncIterator: AsyncIterator<any[]>, index: any): Promise<{
    index: any;
    result: IteratorResult<any[], any>;
}>;
export declare function combineAsyncIterable(iterable: AsyncIterable<any[]>[]): AsyncGenerator<any[], any[], unknown>;
export declare function intersectAsyncIterable(iterable: AsyncIterable<any[]>[]): AsyncGenerator<any[], any[], unknown>;
//# sourceMappingURL=utils.d.ts.map