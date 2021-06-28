import { RangeLinearIndice } from "../src/range.linear.indice";
import { NgramIndice } from "../src/ngram.indice";
import mingo from "mingo"
import countries from "./__seed__/country-by-continent.json";
import { saveSharedIndices, restoreSharedIndices } from "../src/utils";
import { SimpleIndice } from "../src/simple.indice";
import { Db } from "../src/db";
import { Schema } from "../src/schema";


let contriesDb: Db;
beforeAll(async () => {
    const indices = new NgramIndice<number>({ gramLen: 3, actuationLimit: 2, toLowcase: true, actuationLimitAuto: true, isLoaded: false });
    countries.forEach((country, key) => indices.add(key, [country.country, country.continent]));
    const range = new RangeLinearIndice<number, string>({ indice: indices, id: 'text', chunkSize: 30 });

    const primaryIndices = new SimpleIndice<object, number>({ isLoaded: false });
    countries.forEach((country, key) => primaryIndices.add(country, key));
    const primaryRange = new RangeLinearIndice<object, number>({ indice: primaryIndices, id: 'primary', chunkSize: 30 });

    const simpleIndices = new SimpleIndice<number, string>({ isLoaded: false });
    countries.forEach((country, key) => simpleIndices.add(key, country.continent));
    const simpleRange = new RangeLinearIndice<number, string>({ indice: simpleIndices, id: 'simple', chunkSize: 30 });
    await Promise.all([
        saveSharedIndices(range),
        saveSharedIndices(primaryRange),
        saveSharedIndices(simpleRange)
    ]);
    const [primary, text, simple] = await Promise.all([
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
    ]);
    contriesDb = new Db(new Schema(primary,
        [
            { indice: text, path: "$text" },
            { indice: simple, path: 'continent' }
        ]
    ))

});

const expectEqualMingo = async (query: any, sort: any, skip: number, count: number) => {
    const actual = await contriesDb.find(query, sort,
        skip,
        count
    )
     expect(actual).toEqual(new mingo.Query(query).find(countries).sort(sort).skip(skip).limit(count).all());
}

test('{ continent: { $nin: ["Oceania", "Asia", "Europe", "Antarctica", "Africa"] } }', async () => {
    await expectEqualMingo(
        {
            'continent': { '$nin': ["Oceania", "Asia", "Europe", "Antarctica", "Africa"] }
        },
         undefined,
        0,
        60
    );
});
test('{ continent: { $eq: "Oceania" } }', async () => {
    await expectEqualMingo(
        { 'continent': { '$eq': "Oceania" } },
        undefined,
        0,
        20
    );
});
test('{ continent: { $lt: "Oceania" } }', async () => {
    await expectEqualMingo(
        { continent: { $lt: "Oceania" } },
        undefined,
        0,
        20
    );
});
test('{ continent: { $gt: "Oceania" } }', async () => {
    await expectEqualMingo(
        { continent: { $gt: "Oceania" } },
        undefined,
        0,
        20
    );
});
// test('{ $text: "Angola", continent: "Africa" }', async () => {
//     await expectEqualMingo(
//         { $text: "Angola", continent: "Africa" },
//         undefined,
//         0,
//         20
//     );
// });
test('{ continent: "Africa" }', async () => {
    await expectEqualMingo(
        { continent: "Africa" },
        undefined,
        0,
        20
    );
});
test('{ not: "Africa" }', async () => {
    await expectEqualMingo(
        { not: "Africa" },
        undefined,
        0,
        20
    );
});
test('{ continent: { $gte: "Oceania" } }, { continent: 1 }', async () => {
    await expectEqualMingo(
        { continent: { $gte: "Oceania" } },
        { continent: 1 },
        0,
        20
    );
});
test('{}, { country: -1 }', async () => {
    await expectEqualMingo(
        { },
        { country: -1 },
        0,
        20
    );
});
test('{}, { continent: -1 }', async () => {
    await expectEqualMingo(
        { },
        { continent: -1 },
        0,
        20
    );
});
test('{ continent: { $in: ["Oceania", "Asia"] } }', async () => {
    await expectEqualMingo(
        { continent: { $in: ["Oceania", "Asia"] } },
        { continent: 1 },
        0,
        20
    );
});




