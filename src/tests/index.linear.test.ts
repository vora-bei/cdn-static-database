import { RangeLinearIndice } from "../range.linear.indice";
import { NgramIndice } from "../ngram.indice";
import { countries } from "./countries.seed";
import { saveSharedIndeces, restoreSharedIndeces } from "../utils";




const indexes = new NgramIndice<number>();
Object.entries(countries).forEach(([key, val]) => indexes.add(Number.parseInt(key), val));
const linear = new RangeLinearIndice<number, string>({ indices: indexes.spread(100), id: 'default_linear' });


saveSharedIndeces(linear)
    .then(
        () => restoreSharedIndeces<number, string>(
            "./default_linear/index.json",
            RangeLinearIndice.deserialize,
            NgramIndice.deserialize
        )
    ).then(async restored => {
        console.log(await restored.find("Аргенnина"));
    });




