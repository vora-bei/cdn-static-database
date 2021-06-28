import { RangeLinearIndice } from "../src/range.linear.indice";
import { NgramIndice } from "../src/ngram.indice";
import movies from "./__seed__/movies";
import { saveSharedIndices, restoreSharedIndices } from "../src/utils";




const indice = new NgramIndice<number>({ actuationLimitAuto: true, isLoaded: false });
movies.forEach((val, key) => indice.add(key, val));


const linear = new RangeLinearIndice<number, string>({ indice, id: 'default_linear' });


saveSharedIndices(linear)
    .then(
        () => restoreSharedIndices<number, string>(
            "default_linear",
            RangeLinearIndice.deserialize,
            NgramIndice.deserialize
        )
    ).then(async restored => {
        console.time("search")
        console.log(await restored.find("Conquest of Paradise"));
        console.timeEnd("search")

    });




