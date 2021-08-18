import { IFindOptions, ISpreadIndice } from './interfaces';
import { newStemmer } from 'snowball-stemmers';
const CHUNK_SIZE_DEFAULT = 100;

interface IOptions extends Record<string, unknown> {
  id?: string;
  algoritm?: string;
  stopWords?: Set<string>;
  isLoaded: boolean;
  load?(options: IOptions): Promise<never>;
}
let id_counter = 1;
export class TextLexIndice<T> implements ISpreadIndice<T, string> {
  public indices: Map<string, T[]> = new Map();
  public options: IOptions;
  public stemmer: { stem: (w: string) => string };
  get keys() {
    const keys = [...this.indices.keys()];
    keys.sort((a, b) => {
      if (a === b) {
        return 0;
      }
      return a < b ? -1 : 1;
    });
    return keys;
  }
  public get id() {
    return this.options.id!;
  }
  constructor({ id = `${id_counter++}`, isLoaded = true, algoritm = 'english', load }: Partial<IOptions> = {}) {
    this.options = {
      isLoaded,
      algoritm,
      id,
      load,
    };
    this.stemmer = newStemmer(algoritm);
    return this;
  }
  add(key: T, value: string | string[]): void {
    const tokens: string[] = [];
    if (Array.isArray(value)) {
      value.forEach(v => tokens.push(...this.tokenizr(v)));
    } else {
      tokens.push(...this.tokenizr(value));
    }
    tokens.forEach(token => {
      const indice = this.indices.get(token) || [];
      indice.push(key);
      this.indices.set(token, indice);
    });
  }
  serializeOptions(): Record<string, unknown> {
    const { load, stopWords, ...options } = this.options;
    if (stopWords) {
      options.stopWords = [...stopWords];
    }
    return options;
  }
  serializeData(): any[] {
    return [...this.indices];
  }
  tokenizr(value: string): string[] {
    return value
      .toLowerCase()
      .split(/[ \,\.]/)
      .filter(v => !this.options.stopWords || !this.options.stopWords.has(v))
      .map(v => this.stemmer.stem(v));
  }
  private async load() {
    if (this.options.isLoaded) {
      return;
    } else if (this.options.load) {
      const { data } = await this.options.load(this.options);
      this.indices = new Map(data);
      this.options.isLoaded = true;
    } else {
      throw Error("option load doesn't implemented");
    }
  }
  private getIndices(tokens: string[]) {
    return tokens.reduce((sum, token) => {
      const r = this.indices.get(token);
      if (r) {
        sum.push(...r);
      }
      return sum;
    }, [] as T[]);
  }
  public async preFilter(tokens: string[], {}: Partial<IFindOptions> = {}): Promise<Map<T, number>> {
    const countResults: Map<T, number> = new Map();
    await this.load();
    const indices = this.getIndices(tokens);
    if (indices) {
      indices.forEach(id => {
        const count = countResults.get(id) || 0;
        countResults.set(id, count + 1);
      });
    }
    if (!tokens.length) {
      const v = [...this.indices.values()];
      return new Map(v.flatMap(indice => indice).map(indice => [indice, 1]));
    }
    return countResults;
  }
  async find(value?: string | string[], { operator = '$eq', sort = 1 }: Partial<IFindOptions> = {}): Promise<T[]> {
    let tokens: string[] = [];
    if (value !== undefined) {
      tokens = Array.isArray(value) ? value.flatMap(v => this.tokenizr(v)) : this.tokenizr(value);
    }
    const preResult = await this.preFilter(tokens, { operator, sort });
    return this.postFilter(preResult);
  }
  public postFilter(countResults: Map<T, number>): T[] {
    const results = [...countResults.entries()].map(([id]) => id);
    return results;
  }

  serialize(): {
    data: Record<string, unknown>[];
    options: Record<string, unknown>;
  } {
    return { data: this.serializeData(), options: this.serializeOptions() };
  }
  static deserialize<T>(data: any, options?: IOptions): TextLexIndice<T> {
    if (!options) {
      options = data;
      data = null;
    }
    if (options && options.stopWords) {
      options.stopWords = new Set(options.stopWords);
    }
    const index = new TextLexIndice<T>(options);
    if (!!data) {
      index.indices = data;
    }
    return index;
  }
  public spread(chunkSize: number = CHUNK_SIZE_DEFAULT): ISpreadIndice<T, string>[] {
    const { id, ...options } = this.options;
    const result: ISpreadIndice<T, string>[] = [];
    let size = 0;
    let map = new Map<string, T[]>();
    this.keys.forEach(key => {
      const value = [...this.indices.get(key)!];
      if (size + value.length <= chunkSize) {
        size = size + value.length;
        map.set(key, value);
      } else {
        while (value.length) {
          map.set(key, value.splice(0, chunkSize - size));
          result.push(TextLexIndice.deserialize<T>(map, options));
          size = 0;
          map = new Map();
        }
      }
    });
    if (size != 0) {
      result.push(TextLexIndice.deserialize<T>(map, options));
    }
    return result;
  }
  public async findAll(
    indices: ISpreadIndice<T, string>[],
    value?: string | string[],
    { operator = '$eq', sort = 1 }: Partial<IFindOptions> = {},
  ): Promise<T[]> {
    let tokens: string[] = [];
    if (value !== undefined) {
      tokens = Array.isArray(value) ? value.flatMap(v => this.tokenizr(v)) : this.tokenizr(value);
    }
    const list = await Promise.all(indices.map(indice => indice.preFilter(tokens, { operator, sort })));
    const combineWeights = list.reduce((sum, weights) => {
      weights.forEach((value, key) => {
        const count = sum.get(key) || 0;
        sum.set(key, count + value);
      });
      return sum;
    }, new Map());
    return this.postFilter(combineWeights);
  }
  public cursorAll(
    indices: ISpreadIndice<T, string>[],
    value?: string | string[],
    { operator = '$eq', sort = 1, chunkSize = 20 }: Partial<IFindOptions> = {},
  ): AsyncIterable<T[]> {
    let tokens: string[] = [];
    if (value !== undefined) {
      tokens = Array.isArray(value) ? value.flatMap(v => this.tokenizr(v)) : this.tokenizr(value);
    }
    let result: T[] | null = null;
    let indiceIndex = 0;
    let data = new Map<T, number>();
    return {
      [Symbol.asyncIterator]() {
        return {
          async next() {
            if (indiceIndex === 0 && !result && indiceIndex <= indices.length - 1) {
              data = await indices[indiceIndex].preFilter(tokens, { operator, sort });
              result = [...data.keys()];
              result.reverse();
            }
            while (!result?.length && indiceIndex < indices.length - 1) {
              indiceIndex++;
              data = await indices[indiceIndex].preFilter(tokens, { operator, sort });
              result = [...data.keys()];
              result.reverse();
            }
            if (result && result.length) {
              const currentChunkSize = Math.min(chunkSize, result.length);
              const value = result.splice(-currentChunkSize, currentChunkSize);
              return { done: false, value };
            } else {
              return { done: true, value: undefined };
            }
          },
        };
      },
    };
  }
}
