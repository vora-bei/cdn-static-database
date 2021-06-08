import { BloomFilter } from "bloom-filters";
import { IIndex } from "interfaces";
import { Range } from "range";

interface IOptions<T, P> {
    indexes?: IIndex<T, P>[];
    id?: string;
}
let id_counter = 1;
export class RangeLinearIndex<T, P> implements IIndex<T, P> {
    public indexes: Map<Range<P>, IIndex<T, P>> = new Map();
    public options: IOptions<T, P>;
    public get id() {
        return this.options.id!!;
    }
    constructor({ indexes, id = `${id_counter++}` }: IOptions<T, P>) {
        if (indexes) {
            this.indexes = new Map(indexes
                .map((index) => [Range.fromKeys<P>(index.keys), index]))
        }
        this.options = { indexes, id };
    }
    tokenizr(search: P): P[] {
        return [search];
    }
    get keys(): P[] {
        return [...this.indexes.keys()].map(k => k.left);
    }
    serialize(): { data: any; options: any; } {
        const data = [...this.indexes]
            .map(([filter, index], i) => ([filter, { ...index.serialize().options, isLoaded: false }]));
        return { data, options: {} };
    }
    static deserialize<T, P>(data: [Range<P>, IIndex<T, P>][], options: { errorRate: number, id: string }): IIndex<T, P> {
        const indexes = new Map(data.map(([{ left, right }, index]) => {
            return [new Range(left, right), index]
        }));
        const index = new RangeLinearIndex<T, P>({ ...options });
        index.indexes = indexes;
        return index;
    }
    async find(value: P): Promise<T[]> {
        const weights = [...this.indexes].map<[number, IIndex<T, P>]>(([filter, index]) => {
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

