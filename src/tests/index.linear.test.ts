import { RangeLinearIndice } from "../range.linear.indice";
import { NgramIndice } from "../ngram.indice";
import { countries } from "./countries.seed";
import { saveSharedIndeces, restoreSharedIndeces } from "../utils";




const indice = new NgramIndice<number>();
Object.entries(countries).forEach(([key, val]) => indice.add(Number.parseInt(key), val));
const linear = new RangeLinearIndice<number, string>({ indice, id: 'default_linear' });


saveSharedIndeces(linear)
    .then(
        () => restoreSharedIndeces<number, string>(
            "default_linear",
            RangeLinearIndice.deserialize,
            NgramIndice.deserialize
        )
    ).then(async restored => {
        console.time("search")
        console.log(await restored.find("Аргенnина"));
        console.timeEnd("search")

    });




