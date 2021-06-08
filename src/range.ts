export class Range<T> {
    left: T;
    right: T;
    constructor(left: T, right: T) {
        this.left = left;
        this.right = right;
    }
    static fromKeys<P>(indexes: P[]) {
        const { left, right } = indexes.reduce<{ left: P | null, right: P | null }>((sum, val) => {
            let left = sum.left === null ? val : sum.left;
            let right = sum.right === null ? val : sum.right;
            return { left: left > val ? val : left, right: right < val ? val : right }
        }, { left: null, right: null });
        if(left===null|| right===null){
            throw new Error("indexes with null left or right border is forbiden");
        }
        return new Range(left, right)
    }
}