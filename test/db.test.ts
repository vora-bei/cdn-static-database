import mingo from 'mingo';
import { Db } from '../src/db';
import { NgramIndice } from '../src/ngram.indice';
import { RangeLinearIndice } from '../src/range.linear.indice';
import { Schema } from '../src/schema';
import { SimpleIndice } from '../src/simple.indice';
import { TextLexIndice } from '../src/text.lex.indice';
import { saveSharedIndices, restoreSharedIndices } from '../src/utils.ssr';
import countries from './__seed__/country-by-continent.json';

let contriesDb: Db;
beforeAll(async () => {
  const indices = new NgramIndice<number>({
    gramLen: 3,
    actuationLimit: 2,
    toLowcase: true,
    actuationLimitAuto: true,
    isLoaded: false,
  });
  countries.forEach((country, key) => indices.add(key, [country.country, country.continent]));
  const range = new RangeLinearIndice<number, string>({ indice: indices, id: 'text', chunkSize: 30 });

  const primaryIndices = new SimpleIndice<Record<string, unknown>, number>({ isLoaded: false });
  countries.forEach((country, key) => primaryIndices.add({ ...country, id: key }, key));
  const primaryRange = new RangeLinearIndice<Record<string, unknown>, number>({
    indice: primaryIndices,
    id: 'primary',
    chunkSize: 30,
  });

  const simpleIndices = new SimpleIndice<number, string>({ isLoaded: false });
  countries.forEach((country, key) => simpleIndices.add(key, country.continent));
  const simpleRange = new RangeLinearIndice<number, string>({ indice: simpleIndices, id: 'simple', chunkSize: 30 });

  const lexIndices = new TextLexIndice<number>({ isLoaded: false });
  countries.forEach((country, key) => lexIndices.add(key, country.country));
  const lexRange = new RangeLinearIndice<number, string>({ indice: lexIndices, id: 'lex', chunkSize: 30 });

  await Promise.all([
    saveSharedIndices(range),
    saveSharedIndices(primaryRange),
    saveSharedIndices(simpleRange),
    saveSharedIndices(lexRange),
  ]);
  const [primary, text, simple, lex] = await Promise.all([
    restoreSharedIndices<number, Record<string, unknown>>(
      'primary',
      RangeLinearIndice.deserialize,
      SimpleIndice.deserialize,
    ),
    restoreSharedIndices<number, string>('text', RangeLinearIndice.deserialize, NgramIndice.deserialize),
    restoreSharedIndices<number, string>('simple', RangeLinearIndice.deserialize, SimpleIndice.deserialize),
    restoreSharedIndices<number, string>('lex', RangeLinearIndice.deserialize, TextLexIndice.deserialize),
  ]);
  contriesDb = new Db(
    new Schema('id', primary, [
      { indice: text, path: '$text' },
      { indice: simple, path: 'continent' },
      { indice: lex, path: '$lex' },
    ]),
  );
});

const expectEqualMingo = async (query: any, sort: any, skip: number, count: number) => {
  const actual = await contriesDb.find(query, sort, skip, count);
  expect(actual.length).toBeGreaterThan(0);
  expect(actual).toEqual(new mingo.Query(query).find(actual).limit(count).all());
};
const expectNinMingo = async (query: any, sort: any, skip: number, count: number) => {
  const actual = await contriesDb.find<{ continent: string }>(query, sort, skip, count);
  const not = new Set(query['$nin'] as string[]);
  expect(actual.every(res => !not.has(res.continent as string))).toBeTruthy();
  expect(actual).toHaveLength(51);
};
const expectSkipGtMingo = async (query: any, sort: any, skip: number, count: number) => {
  const actual = await contriesDb.find<{ continent: string }>(query, sort, skip, count);
  expect(actual.every(res => (res.continent as string) >= 'Oceania')).toBeTruthy();
  expect(actual).toHaveLength(10);
};
const expectLtMingo = async (query: any, sort: any, skip: number, count: number) => {
  const actual = await contriesDb.find<{ continent: string }>(query, sort, skip, count);
  expect(actual.every(res => (res.continent as string) < 'Oceania')).toBeTruthy();
  expect(actual).toHaveLength(20);
};
const expectEqMingo = async (query: any, sort: any, skip: number, count: number) => {
  const actual = await contriesDb.find<{ continent: string }>(query, sort, skip, count);
  expect(actual.every(res => res.continent === 'Oceania')).toBeTruthy();
  expect(actual).toHaveLength(20);
};
const expectTextMingo = async (query: any, sort: any, skip: number, count: number) => {
  const actual = await contriesDb.find<{ continent: string; country: string }>(query, sort, skip, count);
  expect(actual.every(res => (res.continent as string) === 'Africa')).toBeTruthy();
  expect(
    actual.every(
      res => ['ang', 'Ang', 'ngo', 'gol', 'ola'].reduce((s, v) => (res.country.includes(v) ? s + 1 : s), 0) > 2,
    ),
  ).toBeTruthy();
  expect(actual).toHaveLength(1);
};
const expectTextErrorMingo = async (query: any, sort: any, skip: number, count: number) => {
  const actual = await contriesDb.find<{ continent: string; country: string }>(query, sort, skip, count);
  expect(actual).toHaveLength(0);
};

// test('{ continent: { $nin: ["Oceania", "Asia", "Europe", "Antarctica", "Africa"] } }', async () => {
//     await expectNinMingo(
//         {
//             'continent': { '$nin': ["Oceania", "Asia", "Europe", "Antarctica", "Africa"] }
//         },
//         undefined,
//         0,
//         70
//     );
// });
// test('{ continent: { $eq: "Oceania" } }', async () => {
//     await expectEqMingo(
//         { 'continent': { '$eq': "Oceania" } },
//         undefined,
//         0,
//         20
//     );
// });
test('cursor { continent: { $gt: "Oceania" } }', async () => {
  const cursor = contriesDb.cursor({ continent: { $gt: 'Oceania' } }, undefined, 0, 20);
  console.log(await cursor.next());
  console.log(await cursor.hasNext());
});
test('cursor { continent: { $lt: "Oceania" } }', async () => {
  const cursor = contriesDb.cursor({ continent: { $lt: 'Oceania' } }, undefined, 0, 40);
  console.log(await cursor.next());
  console.log(await cursor.hasNext());
  console.log(await cursor.next());
  console.log(await cursor.next());
  console.log(await cursor.next());
});
test('{ continent: { $lt: "Oceania" } }', async () => {
  await expectLtMingo({ continent: { $lt: 'Oceania' } }, undefined, 0, 20);
});
test('{ continent: { $gt: "Oceania" } }', async () => {
  await expectEqualMingo({ continent: { $gt: 'Oceania' } }, undefined, 0, 20);
});
test('{ id: {$lt: 10} }', async () => {
  const result = await contriesDb.find({ id: { $lt: 10 } }, undefined, 0, 20);
  expect(result).toHaveLength(10);
});
test('{ $text: "Angola", continent: "Africa" }', async () => {
  await expectTextMingo({ $text: 'Angoli', continent: { $in: ['Africa'] } }, undefined, 0, 20);
});
test('{ $text: "Angola  Bolivia British Russia", continent: "Africa" }', async () => {
  await expectTextErrorMingo({ $text: 'Angoli Bolivia British Russia' }, undefined, 0, 20);
});
test('{ continent: "Africa" }', async () => {
  await expectEqualMingo({ continent: 'Africa' }, undefined, 0, 20);
});
test('{ continent: "Africa or Asia" }', async () => {
  await expectEqualMingo({ $or: [{ continent: 'Africa' }, { continent: 'Asia' }] }, undefined, 0, 20);
});
test('{ continent: " regex Africa string" }', async () => {
  await expectEqualMingo({ continent: { $regex: '^Afr' } }, undefined, 0, 20);
});
test('{ continent: " regex Africa" }', async () => {
  await expectEqualMingo({ continent: { $regex: /^afr/i } }, undefined, 0, 20);
});
test('{ not: "Africa" }', async () => {
  const result = await contriesDb.find({ continent: { $regex: /^afa/i } }, undefined, 0, 20);
  expect(result).toHaveLength(0);
});
test('{ not: "Africa" }', async () => {
  const result = await contriesDb.find({ not: 'Africa' }, undefined, 0, 20);
  expect(result).toHaveLength(0);
});
test('{ lex: "Russia" }', async () => {
  const result = await contriesDb.find<{ country }>({ $lex: 'Germanies' }, undefined, 0, 20);
  expect(result).toHaveLength(1);
  expect(result[0].country).toEqual('Germany');
});
test('{ continent: { $gte: "Oceania" } }, { continent: 1 }', async () => {
  await expectEqualMingo({ continent: { $gte: 'Oceania' } }, { continent: 1 }, 0, 20);
});
test('{ continent: { $gte: "Oceania" } }, { continent: 1 }, skip: 10', async () => {
  await expectSkipGtMingo({ continent: { $gte: 'Oceania' } }, { continent: 1 }, 10, 10);
});
test('{}, { country: -1 }', async () => {
  await expectEqualMingo({}, { country: -1 }, 0, 20);
});
test('{}, { continent: -1 }', async () => {
  expect(true).toEqual(new mingo.Query({ a: /^abc/ }).test({ a: 'abc' }));
});
test('{ continent: { $in: ["Oceania", "Asia"] } }', async () => {
  await expectEqualMingo({ continent: { $in: ['Oceania', 'Asia'] } }, { continent: 1 }, 0, 20);
});
