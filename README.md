# Search cdn indice

## Mongo query compatible search engine. Deploy assets of indice to CDN.

This is a helper library for the gatsby plugin "gatsby-cdn-search-plugin".
But you can use it independently.

### Base usage

```javascript
 const indice = new NgramIndice<number>({
     gramLen: 3, actuationLimit: 2, toLowcase: true, actuationLimitAuto: true
     });
    countries
        .forEach((country, key) => indices
            .add(key, [country.country, country.continent])
        );
    const range = new RangeLinearIndice<number, string>({
        indice,
        id: 'text',
        chunkSize: 30
     });

    const primaryIndices = new SimpleIndice<Record<string, unknown>, number>({ });
    countries
        .forEach((country, key) => primaryIndices
            .add({ ...country, id: key }, key)
        );
    const primaryRange = new RangeLinearIndice<Record<string, unknown>, number>({
         indice: primaryIndices,
          id: 'primary',
          chunkSize: 30
     });

    const simpleIndices = new SimpleIndice<number, string>({  });
    countries
        .forEach((country, key) => simpleIndices.add(key, country.continent));
    const simpleRange = new RangeLinearIndice<number, string>({
        indice: simpleIndices,
        id: 'simple',
        chunkSize: 30
     });
    await Promise.all([
        saveSharedIndices(range),
        saveSharedIndices(primaryRange),
        saveSharedIndices(simpleRange)
    ]);
    const [primary, text, simple] = await Promise.all([
        restoreSharedIndices<number, Record<string, unknown>>(
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
    contriesDb = new Db(new Schema(
        'id',
        primary,
        [
            { indice: text, path: "$text" },
            { indice: simple, path: 'continent' }
        ]
    ))

    await contriesDb.find(
        { continent: { $gte: "Oceania" } },
        { continent: 1 },
        0,
        20
    )

```

    See more example in tests
