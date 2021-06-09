import nGram from "n-gram";
import { ISpreadIndice } from "./interfaces"
const CHUNK_SIZE_DEFAULT = 100;
const AUTO_LIMIT_FIND_PERCENT = 40;
interface IOptions {
    id?: string;
    number: number;
    limit: number;
    toLowcase: boolean;
    autoLimit: boolean;
    isLoaded: boolean;
    load?: (options: any) => Promise<any>;
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
    constructor(options: IOptions = { number: 3, limit: 2, toLowcase: true, autoLimit: false, isLoaded: true }) {
        const { id = `${id_counter++}` } = options;
        this.nGram = nGram(options.number)
        this.options = { ...options, id };
        return this;
    }
    serializeOptions(): Object {
        return { ...this.options };
    }
    serializeData(): any[] {
        return [...this.indices];
    }
    add(key: T, value: string) {
        this.tokenizr(value).forEach((token) => {
            const index = this.indices.get(token) || [];
            index.push(key);
            this.indices.set(token, index);
        });
    }
    tokenizr(value: string): string[] {
        const v = this.options.toLowcase ? value.toLowerCase() : value;
        return v.split(" ").flatMap((word) => this.nGram(word))
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
    public async preFilter(tokens: string[]): Promise<Map<T, number>> {
        const countResults: Map<T, number> = new Map();
        await this.load();
        tokens.forEach((token) => {
            const indices = this.indices.get(token);
            if (indices) {
                indices.forEach((id) => {
                    let count = countResults.get(id) || 0;
                    countResults.set(id, count + 1);
                });
            }
        });
        const { autoLimit, limit } = this.options;
        const l = this.getLimit(autoLimit, tokens.length, limit);
        return countResults;
    }
    async find(value: string) {
        const tokens = this.tokenizr(value);
        const preResult = await this.preFilter(tokens);
        return this.postFilter(preResult, tokens);
    }
    public postFilter(countResults: Map<T, number>, tokens: string[]): T[] {
        const { autoLimit, limit } = this.options;
        const l = this.getLimit(autoLimit, tokens.length, limit);
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
        const chunkCount = (this.indices.size - this.indices.size % chunkSize) / chunkSize;
        const { id, ...options } = this.options;
        return new Array(chunkCount)
            .fill(0)
            .map<ISpreadIndice<T, string>>((_, i) => NgramIndice.deserialize<T, string>(
                new Map(this
                    .keys
                    .slice(i * chunkSize, (i + 1) * chunkSize)
                    .map(key => [key, [...this.indices.get(key)!]])),
                options
            ))
    }
    public async findAll(indices: ISpreadIndice<T, string>[], value: string): Promise<T[]> {
        const tokens = this.tokenizr(value);
        const list = await Promise.all(indices.map((indice) => indice.preFilter(tokens)));
        const combineWeights = list.reduce((sum, weights) => {
            weights.forEach((value, key) => {
                const count = sum.get(key) || 0
                sum.set(key, count + value);
            })
            return sum;
        }, new Map())
        return this.postFilter(combineWeights, tokens);
    }

}
