import nGram from "n-gram";
import { IIndice } from "./interfaces"
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
export class NgramIndice<T> implements IIndice<T, string>{
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
            const { data } = await this.options.load();
            this.indices = new Map(data);
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
            const indexes = this.indices.get(token);
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
        console.debug([...countResults.entries()], results.length, this.indices.size, l);
        return results;
    }
    private getLimit(autoLimit: boolean, tokensLength: number, limit: number) {
        return autoLimit ? tokensLength * AUTO_LIMIT_FIND_PERCENT / 100 : limit;
    }

    serialize() {
        return { data: [...this.indices], options: this.options }
    }
    static deserialize<T, P>(data: any, options?: any) {
        if (!options) {
            options = data;
        }
        const index = new NgramIndice<P>(options);
        index.indices = data;
        return index;
    }
    public spread(chunkSize: number = CHUNK_SIZE_DEFAULT): IIndice<T, string>[] {
        const chunkCount = (this.indices.size - this.indices.size % chunkSize) / chunkSize;
        const { id, ...options } = this.options;
        console.log(options);
        return new Array(chunkCount)
            .fill(0)
            .map<IIndice<T, string>>((_, i) => NgramIndice.deserialize(
                new Map(this
                    .keys
                    .slice(i * chunkSize, (i + 1) * chunkSize)
                    .map(key => [key, [...this.indices.get(key)!]])),
                options
            ))
    }
}

