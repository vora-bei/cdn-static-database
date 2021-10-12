import { Db } from '../src/db';
import log from '../src/log';
import { NgramIndice } from '../src/ngram.indice';
import { RangeLinearIndice } from '../src/range.linear.indice';
import { Schema } from '../src/schema';
import { SimpleIndice } from '../src/simple.indice';
import { saveSharedIndices, restoreSharedIndices } from '../src/utils.ssr';
import countries from './__seed__/country-by-continent.json';
log.enableAll();

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
  await Promise.all([saveSharedIndices(range), saveSharedIndices(primaryRange), saveSharedIndices(simpleRange)]);
  const [primary, text, simple] = await Promise.all([
    restoreSharedIndices<number, Record<string, unknown>>(
      'primary',
      RangeLinearIndice.deserialize,
      SimpleIndice.deserialize,
    ),
    restoreSharedIndices<number, string>('text', RangeLinearIndice.deserialize, NgramIndice.deserialize),
    restoreSharedIndices<number, string>('simple', RangeLinearIndice.deserialize, SimpleIndice.deserialize),
  ]);
  contriesDb = new Db(
    new Schema('id', primary, [
      { indice: text, path: '$text' },
      { indice: simple, path: 'continent' },
    ]),
  );
});

test('simple text api', async () => {
  const cursor = contriesDb.cursorText<{ country: string }>('Russo', 0, 20);
  const list = await cursor.next();
  expect(list).toHaveLength(1);
  expect(list[0].country).toEqual('Russian Federation');
});
