import { BloomIndex } from "../bloom.index";
import { NgramIndex } from "../ngram.index";
import { countries } from "./countries.seed";
import { saveBloomToFiles, restoreBloom } from "./utils";




const indexes = new NgramIndex<number>();
Object.entries(countries).forEach(([key, val]) => indexes.add(Number.parseInt(key), val));
const bloom = new BloomIndex<number>({ indexes: indexes.spread(10), id: 'default' });


saveBloomToFiles(bloom)
    .then(() => restoreBloom("./bloom/index.json"))
    .then(async bloomRestored => {
        console.log(await bloomRestored.find("Аргенnина"));
    });




