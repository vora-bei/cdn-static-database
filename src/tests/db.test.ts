import { RangeLinearIndice } from "../range.linear.indice";
import { NgramIndice } from "../ngram.indice";
import countries from "./country-by-continent.json";
import { saveSharedIndices, restoreSharedIndices } from "../utils";
import { SimpleIndice } from "../simple.indice";
import { Db } from "../db";
import { Schema, IndiceType } from "../schema";

const indices = new NgramIndice<number>({ gramLen: 3, actuationLimit: 2, toLowcase: true, actuationLimitAuto: true, isLoaded: false });
countries.forEach((country, key) => indices.add(key, [country.country, country.continent]));
const range = new RangeLinearIndice<number, string>({ indice: indices, id: 'text' });

const primaryIndices = new SimpleIndice<object, number>({ isLoaded: false });
countries.forEach((country, key) => primaryIndices.add(country, key));
const primaryRange = new RangeLinearIndice<object, number>({ indice: primaryIndices, id: 'primary' });

const simplaeIndices = new SimpleIndice<number, string>({ isLoaded: false });
countries.forEach((country, key) => simplaeIndices.add(key, country.continent));
const simpleRange = new RangeLinearIndice<number, string>({ indice: simplaeIndices, id: 'simple' });


Promise.all([
    saveSharedIndices(range),
    saveSharedIndices(primaryRange),
    saveSharedIndices(simpleRange)
]).then(
    () => Promise.all([
        restoreSharedIndices<number, object>(
            "primary",
            RangeLinearIndice.deserialize,
            SimpleIndice.deserialize
        ),
        restoreSharedIndices<number, string>(
            "text",
            RangeLinearIndice.deserialize,
            NgramIndice.deserialize
        ),
        restoreSharedIndices<number, string>(
            "simple",
            RangeLinearIndice.deserialize,
            SimpleIndice.deserialize
        ),
    ])
)
    .then(async ([primary, text, simple]) => {

        const contries = new Db(new Schema(primary,
            [
                { indice: text, type: IndiceType.GLOBAL },
                { indice: simple, path: 'continent', type: IndiceType.LOCAL }
            ]
        ));
        console.log('$eq', await contries.find({'continent':{'$eq': "Oceania"}}, undefined, 0, 20))
        console.log('$lt', await contries.find({'continent':{'$lt': "Oceania"}}, undefined, 0, 20))
        console.log('$gt', await contries.find({'continent':{'$gt': "Oceania"}}, undefined, 0, 20))
        console.log('$text', await contries.find({'$text': "Ang", 'continent': 'Africa' }, undefined, 0, 20))
        console.log('$eq simple', await contries.find({'continent': 'Africa' }, undefined, 0, 20))
        console.log('missed index', await contries.find({'not': 'Africa' }, undefined, 0, 20))
       // console.log(await text.find("Аргенnина"));
    });




