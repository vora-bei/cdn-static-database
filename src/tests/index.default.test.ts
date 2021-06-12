import { BloomIndice } from "../bloom.indice";
import { NgramIndice } from "../ngram.indice";
import { countries } from "./countries.seed";
import { saveSharedIndices, restoreSharedIndices } from "../utils";


const indice = new NgramIndice<number>();
Object.entries(countries).forEach(([key, val]) => indice.add(Number.parseInt(key), val));
const bloom = new BloomIndice<number>({ indice, id: 'default_bloom' });


saveSharedIndices(bloom)
    .then(
        () => restoreSharedIndices<number, string>(
            "default_bloom",
            BloomIndice.deserialize,
            NgramIndice.deserialize
        )
    ).then(async bloomRestored => {
        console.log(await bloomRestored.find("Аргенnина"));
    });




