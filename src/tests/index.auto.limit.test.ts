import { BloomIndice } from "../bloom.indice";
import { NgramIndice } from "../ngram.indice";
import { countries } from "./countries.seed";
import { saveSharedIndices, restoreSharedIndices } from "../utils";

const indices = new NgramIndice<number>({ gramLen: 3, actuationLimit: 2, toLowcase: true, actuationLimitAuto: true, isLoaded: false });
Object.entries(countries).forEach(([key, val]) => indices.add(Number.parseInt(key), val));
const bloom = new BloomIndice<number>({ indice: indices, id: 'auto_bloom' });


saveSharedIndices(bloom)
    .then(
        () => restoreSharedIndices<number, string>(
            "auto_bloom",
            BloomIndice.deserialize,
            NgramIndice.deserialize
        )
    )
    .then(async bloomRestored => {
        console.log(await bloomRestored.find("Аргенnина"));
    });




