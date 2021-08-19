import { ISharedIndice } from '../src/@types/indice';
import { NgramIndice } from '../src/ngram.indice';
import { RangeLinearIndice } from '../src/range.linear.indice';
import { saveSharedIndices, restoreSharedIndices } from '../src/utils.ssr';
import movies from './__seed__/movies.json';

let indiceRestored: ISharedIndice<number, string>;
beforeAll(async () => {
  const indice = new NgramIndice<number>({ actuationLimit: 4, isLoaded: false });
  movies.forEach((val, key) => indice.add(key, val));
  const linear = new RangeLinearIndice<number, string>({ indice, id: 'default_linear' });
  await saveSharedIndices(linear);
  indiceRestored = await restoreSharedIndices<number, string>(
    'default_linear',
    RangeLinearIndice.deserialize,
    NgramIndice.deserialize,
  );
});

test('search indices', async () => {
  const results = await indiceRestored.find('Conquest of Paradise');
  const resMovies = results.map(i => movies[i]);
  expect(resMovies.some(text => text.includes('Paradise'))).toBeTruthy();
  expect(resMovies.some(text => text.includes('Parad'))).toBeTruthy();
  expect(resMovies.some(text => text.includes('Conquest'))).toBeTruthy();
  expect(results).toHaveLength(86);
});
