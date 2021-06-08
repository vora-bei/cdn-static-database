import { BloomIndice } from "../bloom.indice";
import { NgramIndice } from "../ngram.indice";
import { countries } from "./countries.seed";
import { saveSharedIndeces, restoreSharedIndeces } from "../utils";


const indices = new NgramIndice<number>();
Object.entries(countries).forEach(([key, val]) => indices.add(Number.parseInt(key), val));
const bloom = new BloomIndice<number>({ indices: indices.spread(100), id: 'default_bloom' });


saveSharedIndeces(bloom)
    .then(
        () => restoreSharedIndeces<number, string>(
            "./default_bloom/index.json",
            BloomIndice.deserialize,
            NgramIndice.deserialize
        )
    ).then(async bloomRestored => {
        console.log(await bloomRestored.find("Аргенnина"));
    });




