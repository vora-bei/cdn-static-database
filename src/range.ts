export class Range<T> {
  left: T;
  right: T;
  constructor(left: T, right: T) {
    this.left = left;
    this.right = right;
  }
  static fromKeys<P>(indexes: P[]): Range<P> {
    const { left, right } = indexes.reduce<{ left: P | null; right: P | null }>(
      (sum, val) => {
        const left = sum.left === null ? val : sum.left;
        const right = sum.right === null ? val : sum.right;
        return { left: left > val ? val : left, right: right < val ? val : right };
      },
      { left: null, right: null },
    );
    return new Range(left!, right!);
  }
  public has(token: T): boolean {
    return token >= this.left && token <= this.right;
  }
  public match(token: T): boolean {
    let source: string;
    let ignoreCase = false;
    if (token instanceof RegExp) {
      source = token.source;
      ignoreCase = token.ignoreCase;
    } else {
      source = `${token}`.toString();
    }

    const match = source.match(/\^([\w\d]+)/);
    if (!match) {
      return false;
    }
    const m = ignoreCase ? match[1].toLowerCase() : match[1];
    const left = ignoreCase ? `${this.left}`.toLowerCase() : `${this.left}`;
    const right = ignoreCase ? `${this.right}`.toLowerCase() : `${this.right}`;
    const result = (m >= left || left.startsWith(m)) && (m <= right || right.startsWith(m));
    return result;
  }
  public lt(token: T): boolean {
    return token >= this.right || this.has(token);
  }
  public gt(token: T): boolean {
    return token <= this.left || this.has(token);
  }
  test(token: T, operator: string): boolean {
    switch (operator) {
      case '$eq':
      case '$in':
        return this.has(token);
      case '$nin':
      case '$ne':
        return true;
      case '$lt':
      case '$lte':
        return this.lt(token);
      case '$gt':
      case '$gte':
        return this.gt(token);
      case '$regex':
        return this.match(token);
      default:
        return this.has(token);
    }
  }
}
