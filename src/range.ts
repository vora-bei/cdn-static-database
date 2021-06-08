export class Range<T> {
    left: T;
    right: T;
    constructor(left: T, right: T) {
        this.left = left;
        this.right = right;
    }
    static fromKeys<P>(indexes: P[]): Range<P> {
        const { left, right } = indexes.reduce<{ left: P| null , right: P | null  }>((sum, val) => {
            let left = sum.left === null ? val : sum.left;
            let right = sum.right === null ? val : sum.right;
            return { left: left > val ? val : left, right: right < val ? val : right }
        }, { left: null, right: null });
        return new Range(left!, right!)
    }
    public has(token: T): boolean {
       return token >= this.left && token <= this.right;
    }
}