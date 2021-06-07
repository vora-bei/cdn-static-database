import { BloomFilter } from "bloom-filters";
import { IIndex } from "interfaces";

interface IOptions<T> {
    errorRate?: number;
    indexes?: IIndex<T>[];
    id?: string;
}
let id_counter = 1;
export class BloomIndex<T> implements IIndex<T> {
    public indexes: Map<BloomFilter, IIndex<T>> = new Map();
    public options: IOptions<T>;
    public get id() {
        return this.options.id!!;
    }
    constructor({ errorRate = 0.05, indexes, id = `${id_counter++}` }: IOptions<T>) {
        if (indexes) {
            this.indexes = new Map(indexes.map((index) => [BloomFilter.from(index.keys, errorRate), index]))
        }
        this.options = { errorRate, indexes, id };
    }
    tokenizr(search: string): string[] {
        return [search];
    }
    get keys(): string[] {
        return [...this.indexes.keys()].map(k=>k.saveAsJSON().toString());
    }
    serialize(): { data: any; options: any; } {
        const { errorRate } = this.options;
        const data = [...this.indexes]
            .map(([filter, index], i) => ([filter.saveAsJSON(), { ...index.serialize().options, isLoaded: false }]));
        return { data, options: { errorRate } };
    }
    static deserialize<P>(data: [Object, IIndex<P>][], options: { errorRate: number, id: string }): IIndex<P> {
        const indexes = new Map(data.map(([bloom, index]) => {
            return [BloomFilter.fromJSON(bloom), index]
        }));
        const index = new BloomIndex<P>({ ...options });
        index.indexes = indexes;
        return index;
    }
    async find(value: string): Promise<T[]> {
        const weights = [...this.indexes].map<[number, IIndex<T>]>(([filter, index]) => {
            const tokens = index.tokenizr(value);
            const width = tokens.reduce((w, token) => filter.has(token) ? 1 + w : w, 0);
            return [width, index];
        }).filter(([width]) => !!width)
        const list = await Promise.all(weights.map(([_, index]) => index.find(value)));
        return list.flatMap(res => res);
    }
    toJson() {
        return JSON.stringify(this.indexes);
    }
}

