import { ISpreadIndice } from "./interfaces"
const CHUNK_SIZE_DEFAULT = 100;
interface IOptions extends Record<string, unknown> {
    id?: string;
    isLoaded: boolean;
    load?(options: any): Promise<any>;
}
let id_counter = 1;
export class SimpleIndice<T, P> implements ISpreadIndice<T, P>{
    public indices: Map<P, T[]> = new Map();
    public options: IOptions;
    get keys() {
        const keys = [...this.indices.keys()];
        keys.sort((a, b) => {
            if (a === b) {
                return 0;
            }
            return a < b ? -1 : 1;
        })
        return keys;
    }
    public get id() {
        return this.options.id!;
    }
    constructor({
        id = `${id_counter++}`,
        isLoaded = true,
        load
    }: Partial<IOptions> = {}) {
        this.options = {
            isLoaded,
            id,
            load
        };
        return this;
    }
    add(key: T, value: P | P[]): void {
        const tokens: P[] = []
        if (Array.isArray(value)) {
            tokens.push(...value);
        } else {
            tokens.push(value);
        }
        tokens.forEach((token) => {
            const indice = this.indices.get(token) || []
            indice.push(key);
            this.indices.set(token, indice);
        });
    }
    serializeOptions(): Record<string, unknown> {
        const { load, ...options } = this.options;
        return options;
    }
    serializeData(): any[] {
        return [...this.indices];
    }
    tokenizr(value: P): P[] {
        return [value]
    }
    private async load() {
        if (this.options.isLoaded) {
            return;
        } else if (this.options.load) {
            const { data } = await this.options.load(this.options);
            this.indices = new Map(data);
            this.options.isLoaded = true;
        } else {
            throw (Error("option load doesn't implemented"))
        }
    }
    private getIndices(tokens: P[], operator: string, sort: 1 | -1 = 1) {
        switch (operator) {
            case '$lte': {
                return this.getIndicesFullScanOr(tokens, (a, b) => a <= b, sort);
            }
            case '$lt': {
                return this.getIndicesFullScanOr(tokens, (a, b) => a < b, sort);
            }
            case '$gte': {
                return this.getIndicesFullScanOr(tokens, (a, b) => a >= b, sort);
            }
            case '$gt': {
                return this.getIndicesFullScanOr(tokens, (a, b) => a > b, sort);
            }
            case '$regex': {
                return this.getIndicesFullScanOr(tokens, (a, b) => {
                   const regexp = b instanceof RegExp? b: new RegExp(`${b}`);
                   return regexp.test(`${a}`)
                }, sort);

            }
            case '$nin':
            case '$ne': {
                return this.getIndicesFullScanAnd(tokens, (a, b) => a != b, sort);
            }
            case '$eq':
            case '$in':
            default:
                return tokens.reduce((sum, token) => {
                    const r = this.indices.get(token);
                    if (r) {
                        sum.push(...r);
                    }
                    return sum;
                }, [] as T[]);
                
        }
    }
    public getIndicesFullScanOr(tokens: P[], cond: (a: P, b: P) => boolean, sort: 1 | -1 = 1) {
        const keys = this.keys;
        if (sort === -1) {
            keys.reverse();
        }
        return keys.reduce((sum, k) => {
            if (tokens.some(token => cond(k, token))) {
                const ids = this.indices.get(k)!;
                sum.push(...ids)
            };
            return sum;
        }, [] as T[]);
    }
    public getIndicesFullScanAnd(tokens: P[], cond: (a: P, b: P) => boolean, sort: 1 | -1 = 1) {
        const keys = this.keys;
        if (sort === -1) {
            keys.reverse();
        }
        return keys.reduce((sum, k) => {
            if (tokens.every(token => cond(k, token))) {
                const ids = this.indices.get(k)!;
                sum.push(...ids)
            };
            return sum;
        }, [] as T[]);
    }
    public async preFilter(tokens: P[], operator: string, sort: -1 | 1 = 1): Promise<Map<T, number>> {
        const countResults: Map<T, number> = new Map();
        await this.load();
        const t = [...tokens];
        t.sort((a, b) => {
            if (a === b) {
                return 0;
            }
            return (a < b ? 1 : -1) * sort
        });
        const indices = this.getIndices(t, operator, sort);
        if (indices) {
            indices.forEach((id) => {
                const count = countResults.get(id) || 0;
                countResults.set(id, count + 1);
            });
        }
        if (!tokens.length) {
            const v = [...this.indices.values()]
            if (sort === -1) {
                v.reverse();
            }
            return new Map(
                v.flatMap((indice) => indice)
                    .map(indice => [indice, 1])
            )
        }
        return countResults;
    }
    async find(value?: P | P[], operator = "$eq", sort: -1 | 1 = 1) {
        let tokens: P[] = []
        if (value !== undefined) {
            tokens = Array.isArray(value) ? value.flatMap(v => this.tokenizr(v)) : this.tokenizr(value);
        }
        const preResult = await this.preFilter(tokens, operator, sort);
        return this.postFilter(preResult, tokens);
    }
    public postFilter(countResults: Map<T, number>, tokens: P[]): T[] {
        const results = [...countResults.entries()]
            .map(([id]) => id);
        return results;
    }

    serialize() {
        return { data: this.serializeData(), options: this.serializeOptions() }
    }
    static deserialize<T, P>(data: any, options?: any) {
        if (!options) {
            options = data;
            data = null;
        }
        const index = new SimpleIndice<T, P>(options);
        if (!!data) {
            index.indices = data;
        }
        return index;
    }
    public spread(chunkSize: number = CHUNK_SIZE_DEFAULT): ISpreadIndice<T, P>[] {
        const { id, ...options } = this.options;
        const chunkSizeMax = chunkSize * 10;
        const result: ISpreadIndice<T, P>[] = [];
        let size = 0;
        let map = new Map<P, T[]>();
        this.keys.forEach((key) => {
            const value = this.indices.get(key)!;
            if (size > chunkSizeMax) {
                while (value.length) {
                    const leftValue = value.splice(0, chunkSizeMax - size);
                    map.set(key, leftValue);
                    result.push(SimpleIndice.deserialize<T, P>(
                        map,
                        options
                    ));
                    map = new Map();
                    size = 0;
                }
            } else if (size >= chunkSize) {
                result.push(SimpleIndice.deserialize<T, P>(
                    map,
                    options
                ))
                size = value.length;
                map = new Map([[key, value]]);
            } else {
                size = size + value.length;
                map.set(key, value);
            }
        })
        if (size != 0) {
            result.push(SimpleIndice.deserialize<T, P>(
                map,
                options
            ))
        }
        return result;
    }
    public async findAll(indices: ISpreadIndice<T, P>[], value?: P | P[], operator = '$eq', sort: -1 | 1 = 1): Promise<T[]> {
        let tokens: P[] = []
        if (value !== undefined) {
            tokens = Array.isArray(value) ? value.flatMap(v => this.tokenizr(v)) : this.tokenizr(value);
        }
        const list = await Promise.all(indices.map((indice) => indice.preFilter(tokens, operator, sort)));
        const combineWeights = list.reduce((sum, weights) => {
            weights.forEach((value, key) => {
                const count = sum.get(key) || 0
                sum.set(key, count + value);
            })
            return sum;
        }, new Map())
        return this.postFilter(combineWeights, tokens);
    }
    public cursorAll(indices: ISpreadIndice<T, P>[], value?: P | P[], operator = '$eq', sort: -1 | 1 = 1): AsyncIterable<T[]> {
        let tokens: P[] = []
        if (value !== undefined) {
            tokens = Array.isArray(value) ? value.flatMap(v => this.tokenizr(v)) : this.tokenizr(value);
        }
        let result: T[] | null = null;
        let indiceIndex = 0;
        let data = new Map<T, number>();
        const chunkSize = 20;
        return {
            [Symbol.asyncIterator]() {
                return {
                    async next() {
                        if (indiceIndex === 0 && !result && indiceIndex <= indices.length - 1) {
                            data = await indices[indiceIndex].preFilter(tokens, operator, sort);
                            result = [...data.keys()];
                            result.reverse();
                        }
                        while (!result?.length && indiceIndex < indices.length - 1) {
                            indiceIndex++;
                            data = await indices[indiceIndex].preFilter(tokens, operator, sort);
                            result = [...data.keys()];
                            result.reverse();
                        }
                        if (result && result.length) {
                            const currentChunkSize = Math.min(chunkSize, result.length);
                            const value = result.splice(-currentChunkSize, currentChunkSize);
                            return { done: false, value  };
                        } else {
                            return { done: true, value: undefined };
                        }
                    }
                }
            }
        }
    }

}
