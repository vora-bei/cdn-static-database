import { ISpreadIndice } from "./interfaces"
const CHUNK_SIZE_DEFAULT = 100;
interface IOptions {
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
        return this.options.id!!;
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
    serializeOptions(): Object {
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
    public getIndices(token: P, operator: string) {
        switch (operator) {
            case '$eq':
                return this.indices.get(token);
            case '$lte':
            case '$lt': {
                const result: T[] = [];
                this.keys.forEach(k => {
                    if (k <= token) {
                        const ids = this.indices.get(k)!;
                        result.push(...ids)
                    }
                });
                return result;
            }
            case '$gte':
            case '$gt': {
                const result: T[] = [];
                this.keys.forEach(k => {
                    if (k >= token) {
                        const ids = this.indices.get(k)!;
                        result.push(...ids)
                    }
                });
                return result;
            }
            default:
                return this.indices.get(token);
        }
    }
    public async preFilter(tokens: P[], operator: string): Promise<Map<T, number>> {
        const countResults: Map<T, number> = new Map();
        await this.load();
        tokens.forEach((token) => {
            const indices = this.getIndices(token, operator);
            if (indices) {
                indices.forEach((id) => {
                    let count = countResults.get(id) || 0;
                    countResults.set(id, count + 1);
                });
            }
        });
        if (!tokens.length) {
            return new Map(
                [...this.indices.values()]
                    .flatMap((indice) => indice)
                    .map(indice => [indice, 1])
            )
        }
        return countResults;
    }
    async find(value?: P | P[], operator: string = "$eq") {
        let tokens: P[] = []
        if (value !== undefined) {
            tokens = Array.isArray(value) ? value.flatMap(v => this.tokenizr(v)) : this.tokenizr(value);
        }
        const preResult = await this.preFilter(tokens, operator);
        return this.postFilter(preResult, tokens);
    }
    cursor(value?: P | P[], operator?: string): AsyncIterable<T> {
        const load$ = this.load();
        const result$ = this.find(value, operator);
        let index = 0;
        return {
            [Symbol.asyncIterator]() {
                return {
                    index: 0,
                    data: new Map<any, any>(),
                    async next() {
                        await load$;
                        const result = await result$;
                        if (index < result.length) {
                            const value = result[index];
                            index++;
                            return { done: false, value };
                        } else {
                            return { done: true, value: undefined };
                        }
                    }
                }
            }
        }
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

        const result: ISpreadIndice<T, P>[] = [];
        let size = 0;
        let map = new Map<P, T[]>();
        this.keys.forEach((key) => {
            const value = this.indices.get(key)!;
            if (size > chunkSize) {
                result.push(SimpleIndice.deserialize<T, P>(
                    map,
                    options
                ))
                size = 0;
                map = new Map();
            } else {
                size = size + 1;
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
    public async findAll(indices: ISpreadIndice<T, P>[], value: P | P[], operator = '$eq'): Promise<T[]> {
        const tokens = Array.isArray(value) ? value.flatMap(v => this.tokenizr(v)) : this.tokenizr(value);
        const list = await Promise.all(indices.map((indice) => indice.preFilter(tokens, operator)));
        const combineWeights = list.reduce((sum, weights) => {
            weights.forEach((value, key) => {
                const count = sum.get(key) || 0
                sum.set(key, count + value);
            })
            return sum;
        }, new Map())
        return this.postFilter(combineWeights, tokens);
    }
    public cursorAll(indices: ISpreadIndice<T, P>[], value?: P | P[], operator: string = '$eq'): AsyncIterable<T> {
        let tokens: P[] = []
        if (value !== undefined) {
            tokens = Array.isArray(value) ? value.flatMap(v => this.tokenizr(v)) : this.tokenizr(value);
        }
        let result: IterableIterator<T> | null = null;
        let indiceIndex = 0;
        let data = new Map<T, number>();

        return {
            [Symbol.asyncIterator]() {
                return {
                    async next() {
                        if (result === null) {
                            data = await indices[indiceIndex].preFilter(tokens, operator);
                            result = data.keys();
                        }
                        let item = result!.next();
                        if (item.done) {
                            indiceIndex++;
                            data = await indices[indiceIndex].preFilter(tokens, operator);
                            result = data.keys();
                            item = result!.next();
                        }
                        if (!item.done) {
                            const value = item.value;
                            return { done: false, value };
                        } else {
                            return { done: true, value: undefined };
                        }
                    }
                }
            }
        }
    }

}
