import { BloomFilter } from "bloom-filters";
import { ISharedIndice, ISpreadIndice } from "./interfaces";

const DEFAULT_CHUNK_ZIZE = 1000;
interface IOptions<T> {
    errorRate?: number;
    chunkSize?: number;
    indice?: ISpreadIndice<T, string>;
    id?: string;
}
interface ISerializeOptions<T, P> {
    self: IOptions<T>;
    spread?: any;
}
let id_counter = 1;
export class BloomIndice<T> implements ISharedIndice<T, string> {
    public indices: Map<BloomFilter, ISpreadIndice<T, string>> = new Map();
    private indice?: ISpreadIndice<T, string>;
    public options: IOptions<T>;
    public get id() {
        return this.options.id!!;
    }
    constructor({ errorRate = 0.05, indice, chunkSize = DEFAULT_CHUNK_ZIZE, id = `${id_counter++}` }: IOptions<T>) {
        if (indice) {
            this.indice = indice;
            this.indices = new Map(indice.spread(chunkSize).map((indice) => [BloomFilter.from(indice.keys, errorRate), indice]))
        }
        this.options = { errorRate, id };
    }
    serializeOptions() {
        const { errorRate } = this.options;
        return {self: { errorRate }, spread: this.indice?.serializeOptions()};
    }
    serializeData(): any[] {
        return [...this.indices]
            .map(([filter, indice], i) => ([filter.saveAsJSON(), { ...indice.serialize().options, isLoaded: false }]));
    }
    tokenizr(search: string): string[] {
        return [search];
    }
    get keys(): string[] {
        return [...this.indices.keys()].map(k => k.saveAsJSON().toString());
    }
    serialize(): { data: any; options: any; } {
        return { data: this.serializeData(), options: this.serializeOptions() };
    }
  
    static deserialize<T>(
        data: [BloomFilter, T][],
        options: ISerializeOptions<T, string>,
        deserialize: (data: any, options?: any) => ISpreadIndice<T, string>
    ): ISharedIndice<T, string> {
        const indices = new Map(data.map(([bloom, id]) => {
            return [BloomFilter.fromJSON(bloom), deserialize({...options.spread, id})]
        }));
        const indice = new BloomIndice<T>({ ...options.self });
        indice.indices = indices;
        indice.indice =  deserialize({...options.spread})
        return indice;
    }


    async find(value: string): Promise<T[]> {
        if (!this.indice) {
            throw new Error("Spread indice doesn't initialized")
        }
        const tokens = this.indice.tokenizr(value);
        const weights = [...this.indices].map<[number, ISpreadIndice<T, string>]>(([filter, indice]) => {
            const width = tokens.reduce((w, token) => filter.has(token) ? 1 + w : w, 0);
            return [width, indice];
        }).filter(([width]) => !!width)
            .map(([_, indice]) => indice)
        return this.indice.findAll(weights, value);
    }
}

