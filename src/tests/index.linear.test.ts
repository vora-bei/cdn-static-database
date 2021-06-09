import { RangeLinearIndice } from "../range.linear.indice";
import { NgramIndice } from "../ngram.indice";
import movies from "./movies";
import { saveSharedIndeces, restoreSharedIndeces } from "../utils";




const indice = new NgramIndice<number>();
movies.forEach((val, key) => indice.add(key, val));
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
        console.log(await restored.find("Conquest of Paradise"));
        console.timeEnd("search")

    });




