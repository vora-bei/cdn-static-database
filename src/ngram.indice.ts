import nGram from 'n-gram';
import { newStemmer } from 'snowball-stemmers';
import { IFindOptions, ISpreadIndice } from './@types/indice';

const CHUNK_SIZE_DEFAULT = 100;
const AUTO_LIMIT_FIND_PERCENT = 40;
interface IOptions extends Record<string, unknown> {
  id?: string;
  gramLen: number;
  actuationLimit: number;
  toLowcase: boolean;
  actuationLimitAuto: boolean;
  stem?: string;
  stopWords?: Set<string>;
  preTokenizr?(value: string): string;
  postTokenizr?(value: string, tokens: string[]): string[];
  isLoaded: boolean;
  load?(options: IOptions): Promise<never>;
}
let id_counter = 1;

export class NgramIndice<T> implements ISpreadIndice<T, string> {
  private nGram: ReturnType<typeof nGram>;
  public indices: Map<string, T[]> = new Map();
  public stemmer: { stem: (w: string) => string } | null;
  public options: IOptions;
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
  public get id(): string {
    return this.options.id!;
  }
  constructor({
    id = `${id_counter++}`,
    gramLen = 3,
    actuationLimit = 2,
    toLowcase = true,
    actuationLimitAuto = false,
    isLoaded = true,
    stem,
    stopWords = new Set(),
    load,
  }: Partial<IOptions> = {}) {
    this.nGram = nGram(gramLen);
    this.options = {
      gramLen,
      actuationLimit,
      toLowcase,
      actuationLimitAuto,
      isLoaded,
      stem,
      stopWords,
      id,
      load,
    };
    this.stemmer = stem ? newStemmer(stem) : null;
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
      const index = this.indices.get(token) || [];
      index.push(key);
      this.indices.set(token, index);
    });
  }
  serializeOptions(): IOptions {
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
    const { preTokenizr, postTokenizr } = this.options;
    let v = preTokenizr ? preTokenizr(value) : value;
    v = this.options.toLowcase ? v.toLowerCase() : v;
    const tokens = v
      // eslint-disable-next-line no-useless-escape
      .split(/[ \,\.]/)
      .filter(v => !this.options.stopWords || !this.options.stopWords.has(v))
      .map(v => (this.stemmer ? this.stemmer.stem(v) : v))
      .flatMap(word => this.nGram(word));
    return postTokenizr ? postTokenizr(value, tokens) : tokens;
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
  public getIndices(token: string, operator: string): T[] | undefined {
    return this.indices.get(token);
  }
  public async preFilter(tokens: string[], { operator = '$eq' }: Partial<IFindOptions> = {}): Promise<Map<T, number>> {
    const countResults: Map<T, number> = new Map();
    await this.load();
    tokens.forEach(token => {
      const indices = this.getIndices(token, operator);
      if (indices) {
        indices.forEach(id => {
          const count = countResults.get(id) || 0;
          countResults.set(id, count + 1);
        });
      }
    });
    return countResults;
  }
  async find(value?: string | string[], { operator = '$eq' }: Partial<IFindOptions> = {}): Promise<T[]> {
    let tokens: string[] = [];
    if (value !== undefined) {
      tokens = Array.isArray(value) ? value.flatMap(v => this.tokenizr(v)) : this.tokenizr(value);
    }
    const preResult = await this.preFilter(tokens, { operator });
    return this.postFilter(preResult, tokens);
  }
  public postFilter(countResults: Map<T, number>, tokens: string[]): T[] {
    const { actuationLimitAuto, actuationLimit } = this.options;
    const l = this.getLimit(actuationLimitAuto, tokens.length, actuationLimit);
    const results = [...countResults.entries()].filter(([_, count]) => count >= l).map(([id]) => id);
    return results;
  }
  private getLimit(autoLimit: boolean, tokensLength: number, limit: number) {
    return autoLimit ? (tokensLength * AUTO_LIMIT_FIND_PERCENT) / 100 : limit;
  }

  serialize() {
    return { data: this.serializeData(), options: this.serializeOptions() };
  }
  static deserialize<T, P>(data: any, options?: any) {
    if (!options) {
      options = data;
      data = null;
    }
    if (options && options.stopWords) {
      options.stopWords = new Set(options.stopWords);
    }
    const index = new NgramIndice<T>(options);
    if (data) {
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
          result.push(NgramIndice.deserialize<T, string>(map, options));
          size = 0;
          map = new Map();
        }
      }
    });
    if (size != 0) {
      result.push(NgramIndice.deserialize<T, string>(map, options));
    }
    return result;
  }
  public async findAll(
    indices: ISpreadIndice<T, string>[],
    value: string,
    { operator = '$eq' }: Partial<IFindOptions> = {},
  ): Promise<T[]> {
    const tokens = Array.isArray(value) ? value.flatMap(v => this.tokenizr(v)) : this.tokenizr(value);
    const list = await Promise.all(indices.map(indice => indice.preFilter(tokens, { operator })));
    const combineWeights = list.reduce((sum, weights) => {
      weights.forEach((value, key) => {
        const count = sum.get(key) || 0;
        sum.set(key, count + value);
      });
      return sum;
    }, new Map());
    return this.postFilter(combineWeights, tokens);
  }
  private getIndiceChunks(
    indices: ISpreadIndice<T, string>[],
    tokens: string[],
    { operator = '$eq' }: Partial<IFindOptions> = {},
  ) {
    const CHUNK_SIZE = 5;
    const slice: ISpreadIndice<T, string>[] = [...indices.splice(0, CHUNK_SIZE), ...indices.splice(-CHUNK_SIZE)];

    return slice
      .map(indice => indice.preFilter(tokens, { operator }))
      .map(($subResult, index) => {
        return $subResult.then(result => ({
          index,
          result,
        }));
      });
  }
  public cursorAll(
    indices: ISpreadIndice<T, string>[],
    value: string | string[],
    { operator = '$eq' }: Partial<IFindOptions> = {},
  ): AsyncIterable<T[]> {
    const tokens = Array.isArray(value) ? value.flatMap(v => this.tokenizr(v)) : this.tokenizr(value);
    const copyIndices = [...indices];
    let $promises = this.getIndiceChunks(copyIndices, tokens, { operator });
    let count = $promises.length;

    let { postFilter, getIndiceChunks } = this;
    postFilter = postFilter.bind(this);
    getIndiceChunks = getIndiceChunks.bind(this);
    let subResult: T[] = [];
    const combineWeights: Map<T, number> = new Map();
    const alreadyGiveIds: Set<T> = new Set();
    const never: Promise<{
      index: number;
      result: Map<T, number>;
    }> = new Promise(() => {
      // do nothing.
    });
    let i = 1;
    return {
      [Symbol.asyncIterator]() {
        return {
          async next() {
            subResult = [];
            while (count > 0 || copyIndices.length > 0) {
              if (count === 0) {
                $promises = getIndiceChunks(copyIndices, tokens, { operator });
                console.debug('n-gram chunk', $promises.length, copyIndices.length, i++);
                count = $promises.length;
              }
              const { index, result: res } = await Promise.race($promises);
              count--;
              $promises[index] = never;
              res.forEach((weight, key) => {
                const value = combineWeights.get(key) || 0;
                combineWeights.set(key, weight + value);
              }, new Map());
              subResult = postFilter(combineWeights, tokens);
              subResult = subResult.filter(r => !alreadyGiveIds.has(r));
              subResult.forEach(r => {
                alreadyGiveIds.add(r);
                combineWeights.delete(r);
                return r;
              });
              subResult.reverse();
              if (subResult.length) {
                return { done: false, value: subResult };
              }
            }
            return { done: true, value: undefined };
          },
        };
      },
    };
  }
}
