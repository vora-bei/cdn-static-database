import { BloomFilter } from "bloom-filters";
import { ISharedIndice, IIndice } from "interfaces";

interface IOptions<T> {
    errorRate?: number;
    indices?: IIndice<T, string>[];
    id?: string;
}
let id_counter = 1;
export class BloomIndice<T> implements ISharedIndice<T, string> {
    public indices: Map<BloomFilter, IIndice<T, string>> = new Map();
    public options: IOptions<T>;
    public get id() {
        return this.options.id!!;
    }
    constructor({ errorRate = 0.05, indices, id = `${id_counter++}` }: IOptions<T>) {
        if (indices) {
            this.indices = new Map(indices.map((indice) => [BloomFilter.from(indice.keys, errorRate), indice]))
        }
        this.options = { errorRate, id };
    }
    tokenizr(search: string): string[] {
        return [search];
    }
    get keys(): string[] {
        return [...this.indices.keys()].map(k=>k.saveAsJSON().toString());
    }
    serialize(): { data: any; options: any; } {
        const { errorRate } = this.options;
        const data = [...this.indices]
            .map(([filter, indice], i) => ([filter.saveAsJSON(), { ...indice.serialize().options, isLoaded: false }]));
        return { data, options: { errorRate } };
    }
    static deserialize<T, P>(data: [object, IIndice<T, string>][], options: { errorRate: number, id: string }): ISharedIndice<T, string> {
        const indices = new Map(data.map(([bloom, indice]) => {
            return [BloomFilter.fromJSON(bloom), indice]
        }));
        const indice = new BloomIndice<T>({ ...options });
        indice.indices = indices;
        return indice;
    }
    async find(value: string): Promise<T[]> {
        const weights = [...this.indices].map<[number, IIndice<T, string>]>(([filter, indice]) => {
            const tokens = indice.tokenizr(value);
            const width = tokens.reduce((w, token) => filter.has(token) ? 1 + w : w, 0);
            return [width, indice];
        }).filter(([width]) => !!width)
        const list = await Promise.all(weights.map(([_, indice]) => indice.find(value)));
        return list.flatMap(res => res);
    }
    toJson() {
        return JSON.stringify(this.indices);
    }
}

