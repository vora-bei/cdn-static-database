import nGram from "n-gram";
import { ISpreadIndice } from "./interfaces"
const CHUNK_SIZE_DEFAULT = 100;
const AUTO_LIMIT_FIND_PERCENT = 40;
interface IOptions {
    id?: string;
    gramLen: number;
    actuationLimit: number;
    toLowcase: boolean;
    actuationLimitAuto: boolean;
    preTokenizr?(value: string): string;
    postTokenizr?(value: string, tokens: string[]): string[];
    isLoaded: boolean;
    load?(options: any): Promise<any>;
}
let id_counter = 1;
export class NgramIndice<T> implements ISpreadIndice<T, string>{
    private nGram: ReturnType<typeof nGram>;
    public indices: Map<string, T[]> = new Map();
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
        gramLen = 3,
        actuationLimit = 2,
        toLowcase = true,
        actuationLimitAuto = false,
        isLoaded = true,
        load
    }: Partial<IOptions> = {}) {
        this.nGram = nGram(gramLen)
        this.options = {
            gramLen,
            actuationLimit,
            toLowcase,
            actuationLimitAuto,
            isLoaded,
            id,
            load
        };
        return this;
    }
    add(key: T, value: string | string[]): void {
        const tokens: string[] = []
        if (Array.isArray(value)) {
            value.forEach((v) => tokens.push(...this.tokenizr(v)))
        } else {
            tokens.push(...this.tokenizr(value));
        }
        tokens.forEach((token) => {
            const index = this.indices.get(token) || [];
            index.push(key);
            this.indices.set(token, index);
        });
    }
    serializeOptions(): Object {
        const { load, ...options } = this.options;
        return options;
    }
    serializeData(): any[] {
        return [...this.indices];
    }
    tokenizr(value: string): string[] {
        const { preTokenizr, postTokenizr } = this.options;
        let v = preTokenizr ? preTokenizr(value) : value
        v = this.options.toLowcase ? v.toLowerCase() : v;
        const tokens = v.split(" ").flatMap((word) => this.nGram(word))
        return postTokenizr ? postTokenizr(value, tokens) : tokens;

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
    public getIndices(token: string, operator: string) {
       return this.indices.get(token);
    }
    public async preFilter(tokens: string[], operator: string = "$eq"): Promise<Map<T, number>> {
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
        return countResults;
    }
    async find(value?: string | string[], operator: string = "$eq") {
        let tokens: string[] = []
        if (value !== undefined) {
            tokens = Array.isArray(value) ? value.flatMap(v => this.tokenizr(v)) : this.tokenizr(value);
        }
        const preResult = await this.preFilter(tokens, operator);
        return this.postFilter(preResult, tokens);
    }
    public postFilter(countResults: Map<T, number>, tokens: string[]): T[] {
        const { actuationLimitAuto, actuationLimit } = this.options;
        const l = this.getLimit(actuationLimitAuto, tokens.length, actuationLimit);
        const results = [...countResults.entries()]
            .filter(([_, count]) => count >= l)
            .map(([id]) => id);
        return results;
    }
    private getLimit(autoLimit: boolean, tokensLength: number, limit: number) {
        return autoLimit ? tokensLength * AUTO_LIMIT_FIND_PERCENT / 100 : limit;
    }

    serialize() {
        return { data: this.serializeData(), options: this.serializeOptions() }
    }
    static deserialize<T, P>(data: any, options?: any) {
        if (!options) {
            options = data;
            data = null;
        }
        const index = new NgramIndice<T>(options);
        if (!!data) {
            index.indices = data;
        }
        return index;
    }
    public spread(chunkSize: number = CHUNK_SIZE_DEFAULT): ISpreadIndice<T, string>[] {
        const { id, ...options } = this.options;

        const result: ISpreadIndice<T, string>[] = [];
        let size = 0;
        let map = new Map<string, T[]>();
        this.keys.forEach((key) => {
            const value = this.indices.get(key)!;
            if (size >= chunkSize) {
                result.push(NgramIndice.deserialize<T, string>(
                    map,
                    options
                ))
                size = value.length;
                map = new Map([[key, value]]);
            } else if(size + value.length > chunkSize) {
                while(value.length) {
                    const leftValue = value.splice(0, chunkSize - size);
                    map.set(key, leftValue);
                    result.push(NgramIndice.deserialize<T, string>(
                        map,
                        options
                    ));
                    map = new Map();
                    size = 0;
                }
            } else {
                size = size + value.length;
                map.set(key, value);
            }
        })
        if (size != 0) {
            result.push(NgramIndice.deserialize<T, string>(
                map,
                options
            ))
        }
        return result;
    }
    public async findAll(indices: ISpreadIndice<T, string>[], value: string, operator: string='$eq'): Promise<T[]> {
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
    public cursorAll(indices: ISpreadIndice<T, string>[], value: string | string[], operator: string = '$eq'): AsyncIterable<T[]> {
        const tokens = Array.isArray(value) ? value.flatMap(v => this.tokenizr(v)) : this.tokenizr(value);
        const list$ =  Promise.all(indices.map((indice) => indice.preFilter(tokens, operator)));
        let isLoad = false;
        const self = this;
        let result: T[];
        const chunkSize = 20;
        const load = async () => {
            if(isLoad){
                return;
            }
            const list = await list$;
            const combineWeights = list.reduce((sum, weights) => {
                weights.forEach((value, key) => {
                    const count = sum.get(key) || 0
                    sum.set(key, count + value);
                })
                return sum;
            }, new Map())
            result = self.postFilter(combineWeights, tokens);
            result.reverse();
            isLoad = true;
        }
        return {
            [Symbol.asyncIterator]() {
                return {
                    async next() {
                        if (!result || result.length) {
                            await load()
                            const currentChunkSize = Math.min(chunkSize, result.length);
                            const value = result.splice(-currentChunkSize, currentChunkSize);
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
