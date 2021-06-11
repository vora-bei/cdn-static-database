export declare class Range<T> {
    left: T;
    right: T;
    constructor(left: T, right: T);
    static fromKeys<P>(indexes: P[]): Range<P>;
    has(token: T): boolean;
}
//# sourceMappingURL=range.d.ts.map