import { IFindOptions, ISharedIndice, ISpreadIndice } from "./interfaces";
import { Range } from "./range";
const DEFAULT_CHUNK_ZIZE = 2000;

interface IOptions<T, P> {
    chunkSize?: number;
    indice?: ISpreadIndice<T, P>;
    id?: string;
    isLoaded: boolean;
    load?(options: unknown): Promise<any>;
}

interface ISerializeOptions<T, P> extends Record<string, unknown> {
    self: IOptions<T, P>;
    spread?: any;
}
let id_counter = 1;
export class RangeLinearIndice<T, P> implements ISharedIndice<T, P> {
    public indices: Map<Range<P>, ISpreadIndice<T, P>> = new Map();
    private indice?: ISpreadIndice<T, P>;
    private indiceDeserialize?: (options: Record<string, unknown>) => ISpreadIndice<T, P>
    public options: IOptions<T, P>;
    public get id() {
        return this.options.id!;
    }
    constructor({ indice, chunkSize = DEFAULT_CHUNK_ZIZE, id = `${id_counter++}`, isLoaded = true, load }: Partial<IOptions<T, P>>) {
        if (indice) {
            this.indice = indice;
            this.indices = new Map(indice.spread(chunkSize).map((indice) => [Range.fromKeys<P>(indice.keys), indice]))
        }
        this.options = { id, isLoaded, load };
    }
    serialize(): { data: unknown, options: Record<string, unknown> } {
        return { data: this.serializeData(), options: this.serializeOptions() };
    }
    serializeData() {
        return [...this.indices].map(([filter, indice], i) => ([[filter.left, filter.right], indice.id]));
    }
    serializeOptions(): ISerializeOptions<T, P> {
        const { load, ...options } = this.options;
        return { self: options, spread: { ...this.indice?.serializeOptions(), isLoaded: false } };
    }
    testIndice(key: string, value: any): boolean {
        if (key !== '$regex') {
            return true;
        }
        let source: string;
        if (value instanceof RegExp) {
            source = value.source
        }
        source = (value as string).toString();
        return !!source.match(/\^[\w\d]+/);
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
        options: { id: string, load(options: Record<string, unknown>): Promise<any> },
        deserialize: (options: Record<string, unknown>) => ISpreadIndice<T, P>
    ): ISharedIndice<T, P> {
        const indice = new RangeLinearIndice<T, P>({ ...options, isLoaded: false });
        indice.indiceDeserialize = deserialize;
        return indice;
    }
    private filterIndicesByWeight(weight: number, tokens: P[]) {
        return !!weight || !tokens.length
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
    async find(value?: P | P[], { operator = '$eq', sort = 1 }: Partial<IFindOptions> = {}): Promise<T[]> {
        await this.load();
        const { indice } = this;
        if (!indice) {
            throw new Error("Spread indice doesn't initialized")
        }
        let tokens: P[] = []
        if (value !== undefined) {
            tokens = Array.isArray(value) ? value.flatMap(v => indice.tokenizr(v)) : indice.tokenizr(value);
        }
        const indices = [...this.indices].map<[number, ISpreadIndice<T, P>]>(([filter, indice]) => {
            const weight = tokens.reduce((w, token) => filter.test(token, operator) ? 1 + w : w, 0);
            return [weight, indice];
        }).filter(([weight]) => this.filterIndicesByWeight(weight, tokens))
            .map(([_, indice]) => indice);
        if (sort === -1) {
            indices.reverse();
        }
        return indice.findAll(indices, value, { operator, sort });
    }
    cursor(value?: P | P[], { operator = '$eq', sort = 1 }: Partial<IFindOptions> = {}): AsyncIterable<T[]> {
        const load$ = this.load();
        let cursor;
        let iterator;
        let isFound = false;
        const find = async () => {
            const { indice, indices } = this;
            if (isFound) {
                return;
            }
            if (!indice) {
                throw new Error("Spread indice doesn't initialized")
            }
            let tokens: P[] = []
            if (value !== undefined) {
                tokens = Array.isArray(value) ? value.flatMap(v => indice.tokenizr(v)) : indice.tokenizr(value);
            }
            const filteredIndices = [...indices].map<[number, ISpreadIndice<T, P>]>(([filter, indice]) => {
                const weight = tokens.reduce((w, token) => filter.test(token, operator) ? 1 + w : w, 0);
                return [weight, indice];
            }).filter(([weight]) => this.filterIndicesByWeight(weight, tokens))
                .map(([_, indice]) => indice);
            if (sort === -1) {
                filteredIndices.reverse();
            }
            cursor = indice.cursorAll(filteredIndices, value, { operator, sort })
            isFound = true;
            iterator = cursor[Symbol.asyncIterator]()

        };
        return {
            [Symbol.asyncIterator]() {
                return {
                    async next() {
                        await load$;
                        await find();
                        return await iterator.next();
                    }
                }
            }
        }
    }

}

