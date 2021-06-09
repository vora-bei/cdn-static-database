import { IIndice, ISharedIndice, ISpreadIndice } from "interfaces";
import { Range } from "./range";
const DEFAULT_CHUNK_ZIZE = 10;

interface IOptions<T, P> {
    chunkSize?: number;
    indice?: ISpreadIndice<T, P>;
    id?: string;
}

interface ISerializeOptions<T, P> {
    self: IOptions<T, P>;
    spread?: any;
}
let id_counter = 1;
export class RangeLinearIndice<T, P> implements ISharedIndice<T, P> {
    public indices: Map<Range<P>, ISpreadIndice<T, P>> = new Map();
    private indice?: ISpreadIndice<T, P>;
    public options: IOptions<T, P>;
    public get id() {
        return this.options.id!!;
    }
    constructor({ indice, chunkSize = DEFAULT_CHUNK_ZIZE, id = `${id_counter++}` }: IOptions<T, P>) {
        if (indice) {
            this.indice = indice;
            this.indices = new Map(indice.spread(chunkSize).map((indice) => [Range.fromKeys<P>(indice.keys), indice]))
        }
        this.options = { id };
    }
    serialize(): { data: any; options: any; } {
        return { data: this.serializeData(), options: this.serializeOptions() };
    }
    serializeData() {
        return [...this.indices].map(([filter, indice], i) => ([filter, indice.id]));
    }
    serializeOptions(): ISerializeOptions<T, P> {
        return { self: { ...this.options }, spread: { ...this.indice?.serializeOptions(), isLoaded: false } };
    }
    static deserialize<T, P>(
        data: [Range<P>, T][],
        options: ISerializeOptions<T, P>,
        deserialize: (data: any, options?: any) => ISpreadIndice<T, P>
    ): ISharedIndice<T, P> {
        const indices = new Map(data.map(([{ left, right }, id]) => {
            return [new Range(left, right), deserialize({ ...options.spread, id })]
        }));
        const indice = new RangeLinearIndice<T, P>({ ...options.self });
        indice.indices = indices;
        indice.indice = deserialize({ ...options.spread })
        return indice;
    }
    async find(value: P): Promise<T[]> {
        if (!this.indice) {
            throw new Error("Spread indice doesn't initialized")
        }
        const tokens = this.indice.tokenizr(value);
        const weights = [...this.indices].map<[number, ISpreadIndice<T, P>]>(([filter, indice]) => {
            const width = tokens.reduce((w, token) => filter.has(token) ? 1 + w : w, 0);
            return [width, indice];
        }).filter(([width]) => !!width)
            .map(([_, indice]) => indice);
        return this.indice.findAll(weights, value);
    }
}

