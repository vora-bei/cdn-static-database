import { BloomIndex } from "../bloom.index";
import { NgramIndex } from "../ngram.index";
import { countries } from "./countries.seed";
import { saveBloomToFiles, restoreBloom } from "./utils";

const indexes = new NgramIndex<number>({ number: 3, limit: 2, toLowcase: true, autoLimit: true, isLoaded: false });
Object.entries(countries).forEach(([key, val]) => indexes.add(Number.parseInt(key), val));
const bloom = new BloomIndex<number>({ indexes: indexes.spread(10), id: 'auto' });


saveBloomToFiles(bloom)
    .then(() => restoreBloom("./bloom/index.json"))
    .then(async bloomRestored => {
        console.log(await bloomRestored.find("Аргенnина"));
    });




