import { IIndice, ISharedIndice } from "interfaces";
import { Range } from "./range";

interface IOptions<T, P> {
    indices?: IIndice<T, P>[];
    id?: string;
}
let id_counter = 1;
export class RangeLinearIndice<T, P> implements ISharedIndice<T, P> {
    public indices: Map<Range<P>, IIndice<T, P>> = new Map();
    public options: IOptions<T, P>;
    public get id() {
        return this.options.id!!;
    }
    constructor({ indices, id = `${id_counter++}` }: IOptions<T, P>) {
        if (indices) {
            this.indices = new Map(indices
                .map((indice) => [Range.fromKeys<P>(indice.keys), indice]))
        }
        this.options = { id };
    }
    tokenizr(search: P): P[] {
        return [search];
    }
    get keys(): P[] {
        return [...this.indices.keys()].map(k => k.left);
    }
    serialize(): { data: any; options: any; } {
        const data = [...this.indices]
            .map(([filter, indice], i) => ([filter, { ...indice.serialize().options, isLoaded: false }]));
        return { data, options: {...this.options} };
    }
    static deserialize<T, P>(data: [Range<P>, IIndice<T, P>][], options: { id: string }): ISharedIndice<T, P> {
        const indices = new Map(data.map(([{ left, right }, indice]) => {
            return [new Range(left, right), indice]
        }));
        const indice = new RangeLinearIndice<T, P>({ ...options });
        indice.indices = indices;
        return indice;
    }
    async find(value: P): Promise<T[]> {
        const weights = [...this.indices].map<[number, IIndice<T, P>]>(([filter, indice]) => {
            const tokens = indice.tokenizr(value);
            const width = tokens.reduce((w, token) => filter.has(token) ? 1 + w : w, 0);
            return [width, indice];
        }).filter(([width]) => !!width)
        console.log(weights.length, this.indices.size)
        const list = await Promise.all(weights.map(([_, indice]) => indice.find(value)));
        return list.flatMap(res => res);
    }
    toJson() {
        return JSON.stringify(this.indices);
    }
}

