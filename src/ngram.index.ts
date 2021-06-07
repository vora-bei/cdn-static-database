import nGram from "n-gram";
import { IIndex } from "./interfaces"
const CHUNK_SIZE_DEFAULT = 100;
const AUTO_LIMIT_FIND_PERCENT = 40;
interface IOptions {
    id?: string;
    number: number;
    limit: number;
    toLowcase: boolean;
    autoLimit: boolean;
    isLoaded: boolean;
    load?: () => Promise<any>;
}
let id_counter = 1;
export class NgramIndex<T> implements IIndex<T>{
    private nGram: ReturnType<typeof nGram>;
    public indexes: Map<string, T[]> = new Map();
    public options: IOptions;
    get keys() {
        return [...this.indexes.keys()]
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
    add(key: T, value: string) {
        this.tokenizr(value).forEach((token) => {
            const index = this.indexes.get(token) || [];
            index.push(key);
            this.indexes.set(token, index);
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
            const { data } = await this.options.load();
            this.indexes = new Map(data);
            this.options.isLoaded = true;
        } else {
            throw (Error("option load doesn't implemented"))
        }
    }
    async find(value: string): Promise<T[]> {
        const countResults: Map<T, number> = new Map();
        await this.load();
        const tokens = this.tokenizr(value);
        this.tokenizr(value).forEach((token) => {
            const indexes = this.indexes.get(token);
            if (indexes) {
                indexes.forEach((id) => {
                    let count = countResults.get(id) || 0;
                    countResults.set(id, count + 1);
                });
            }
        });
        const { autoLimit, limit } = this.options;
        const l = this.getLimit(autoLimit, tokens.length, limit);
        const results = [...countResults.entries()]
            .filter(([_, count]) => count >= l)
            .map(([id]) => id);
        console.debug(results.length);
        return results;
    }
    private getLimit(autoLimit: boolean, tokensLength: number, limit: number) {
        console.debug(tokensLength * AUTO_LIMIT_FIND_PERCENT / 100);
        return autoLimit ? tokensLength * AUTO_LIMIT_FIND_PERCENT / 100 : limit;
    }

    serialize() {
        return { data: [...this.indexes], options: this.options }
    }
    static deserialize<P>(data: any, options?: any) {
        if (!options) {
            options = data;
        }
        const index = new NgramIndex<P>(options);
        index.indexes = data;
        return index;
    }
    public spread(chunkSize: number = CHUNK_SIZE_DEFAULT) {
        const chunkCount = (this.indexes.size - this.indexes.size % chunkSize) / chunkSize;
        const { id, ...options } = this.options;
        console.log(options);
        return new Array(chunkCount)
            .fill(0)
            .map((_, i) => NgramIndex.deserialize<T>(
                new Map(this
                    .keys
                    .slice(i * chunkSize, (i + 1) * chunkSize)
                    .map(key => [key, [...this.indexes.get(key)!]])),
                options
            ))
    }
}

