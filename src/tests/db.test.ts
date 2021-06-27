import { RangeLinearIndice } from "../range.linear.indice";
import { NgramIndice } from "../ngram.indice";
import countries from "./country-by-continent.json";
import { saveSharedIndices, restoreSharedIndices } from "../utils";
import { SimpleIndice } from "../simple.indice";
import { Db } from "../db";
import { Schema } from "../schema";

const indices = new NgramIndice<number>({ gramLen: 3, actuationLimit: 2, toLowcase: true, actuationLimitAuto: true, isLoaded: false });
countries.forEach((country, key) => indices.add(key, [country.country, country.continent]));
const range = new RangeLinearIndice<number, string>({ indice: indices, id: 'text', chunkSize: 30 });

const primaryIndices = new SimpleIndice<object, number>({ isLoaded: false });
countries.forEach((country, key) => primaryIndices.add(country, key));
const primaryRange = new RangeLinearIndice<object, number>({ indice: primaryIndices, id: 'primary', chunkSize: 30 });

const simpleIndices = new SimpleIndice<number, string>({ isLoaded: false });
countries.forEach((country, key) => simpleIndices.add(key, country.continent));
const simpleRange = new RangeLinearIndice<number, string>({ indice: simpleIndices, id: 'simple', chunkSize: 30 });


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
                { indice: text, path: "$text" },
                { indice: simple, path: 'continent' }
            ]
        ));
        console.log('$nin', await contries.find({ 'continent': { '$nin': ["Oceania", "Asia", "Europe", "Antarctica", "Africa"] } }, undefined, 0, 60))
        console.log('$eq', await contries.find({ 'continent': { '$eq': "Oceania" } }, undefined, 0, 20))
        console.log('$lt', await contries.find({ 'continent': { '$lt': "Oceania" } }, undefined, 0, 20))
        console.log('$gt', await contries.find({ 'continent': { '$gt': "Oceania" } }, undefined, 0, 20))
        console.log('$text', await contries.find({ '$text': "Angola", 'continent': 'Africa' }, undefined, 0, 20))
        console.log('$eq simple', await contries.find({ 'continent': 'Africa' }, undefined, 0, 20))
        console.log('missed index', await contries.find({ 'not': 'Africa' }, undefined, 0, 20))
        console.log('$lte sort', await contries.find({ 'continent': { '$gte': "Oceania" } }, { 'continent': 1 }, 0, 30))
        console.log('sort grid', await contries.find({}, { 'country': -1 }, 0, 100))
        console.log('sort', await contries.find({}, { 'continent': -1 }, 0, 100))
        console.log('$in', await contries.find({ 'continent': { '$in': ["Oceania", "Asia"] } }, undefined, 0, 20))


        // console.log(await text.find("Аргенnина"));
    });



