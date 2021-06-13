import { ISharedIndice, ISpreadIndice } from "interfaces";
import { Range } from "./range";
const DEFAULT_CHUNK_ZIZE = 2000;

interface IOptions<T, P> {
    chunkSize?: number;
    indice?: ISpreadIndice<T, P>;
    id?: string;
    isLoaded: boolean;
    load?(options: any): Promise<any>;
}

interface ISerializeOptions<T, P> {
    self: IOptions<T, P>;
    spread?: any;
}
let id_counter = 1;
export class RangeLinearIndice<T, P> implements ISharedIndice<T, P> {
    public indices: Map<Range<P>, ISpreadIndice<T, P>> = new Map();
    private indice?: ISpreadIndice<T, P>;
    private indiceDeserialize?: (options: any) => ISpreadIndice<T, P>
    public options: IOptions<T, P>;
    public get id() {
        return this.options.id!!;
    }
    constructor({ indice, chunkSize = DEFAULT_CHUNK_ZIZE, id = `${id_counter++}`, isLoaded = true, load }: Partial<IOptions<T, P>>) {
        if (indice) {
            this.indice = indice;
            this.indices = new Map(indice.spread(chunkSize).map((indice) => [Range.fromKeys<P>(indice.keys), indice]))
        }
        this.options = { id, isLoaded, load };
    }
    serialize(): { data: any; options: any; } {
        return { data: this.serializeData(), options: this.serializeOptions() };
    }
    serializeData() {
        return [...this.indices].map(([filter, indice], i) => ([[filter.left, filter.right], indice.id]));
    }
    serializeOptions(): ISerializeOptions<T, P> {
        return { self: { ...this.options }, spread: { ...this.indice?.serializeOptions(), isLoaded: false } };
    }

    static deserialize<T, P>(
        data: [[P, P], T][],
        options: ISerializeOptions<T, P>,
        deserialize: (data: any, options?: any) => ISpreadIndice<T, P>
    ): ISharedIndice<T, P> {
        const indices = new Map(data.map(([[left, right], id]) => {
            return [new Range(left, right), deserialize({ ...options.spread, id })]
        }));
        const indice = new RangeLinearIndice<T, P>({ ...options.self });
        indice.indices = indices;
        indice.indice = deserialize({ ...options.spread })
        return indice;
    }
    static lazy<T, P>(
        options: { id: string, load(options: any): Promise<any> },
        deserialize: (options: any) => ISpreadIndice<T, P>
    ): ISharedIndice<T, P> {
        const indice = new RangeLinearIndice<T, P>({ ...options, isLoaded: false });
        indice.indiceDeserialize = deserialize;
        return indice;
    }
    private async load() {
        if (this.options.isLoaded) {
            return;
        } else if (this.options.load) {
            if (!this.indiceDeserialize) {
                throw (Error("deserialzed doesn't set"))
            }
            const { data, options }: {
                data: [[P, P], T][],
                options: ISerializeOptions<T, P>
            } = await this.options.load(this.options);
            const indices = new Map(data.map(([[left, right], id]) => {
                return [new Range(left, right), this.indiceDeserialize!({ ...options.spread, id })]
            }));
            this.indices = indices;
            this.indice = this.indiceDeserialize({ ...options.spread })
            this.options.isLoaded = true;
        } else {
            throw (Error("option load doesn't implemented"))
        }
    }
    async find(value: P): Promise<T[]> {
        await this.load();
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

