## 1.2.1

- add ability to set custom import extension, which will be used when generating new files for your application

## 1.2.0

- update for Dream 1.4.0

## 1.1.11

- 400 is more appropriate than 422 for `DataTypeColumnTypeMismatch`

## 1.1.10

- Don't include deletedAt in generated create/update actions in resource specs since deletedAt is for deleting

- return 422 if Dream throws `NotNullViolation` or `CheckConstraintViolation`

## 1.1.9

- return 422 if dream throws `DataTypeColumnTypeMismatch`, which happens when a dream is saved to the database with data that cannot be inserted into the respective columns, usually because of a type mismatch.

- castParam will now encase params in an array when being explicitly casted as an array type, bypassing a known bug in express from causing arrays with single items in them to be treated as non-arrays.

## 1.1.8

- Tap into CliFileWriter provided by dream to tap into file reversion for sync files, since the auto-sync function in psychic can fail and leave your file tree in a bad state.

## 1.1.7

- Add support for middleware arrays, enabling express plugins like passport

## 1.1.6

- fix regression caused by missing --schema-only option in psychic cli

## 1.1.5

- pass packageManager through to dream, now that it accepts a packageManager setting.
- update dream shadowing within psychic application initialization to take place after initializers and plugins are processed, so that those initializers and plugins have an opportunity to adjust the settings.

## 1.1.4

- fix regressions to redux bindings caused by default openapi path location changes
- resource generator can handle prefixing slashes

## 1.1.3

- fix more minor issues with redux openapi bindings

## 1.1.2

- Fix various issues with openapi redux bindings
- raise hard exception if accidentally using openapi route params in an expressjs route path

## 1.1.1

Fix route printing regression causing route printouts to show the path instead of the action

## v1.1.0

Provides easier access to express middleware by exposing `PsychicApp#use`, which enables a developer to provide express middleware directly through the psychcic application, without tapping into any hooks.

```ts
psy.use((_, res) => {
  res.send(
    'this will be run after psychic middleware (i.e. cors and bodyParser) are processed, but before routes are processed',
  )
})
```

Some middleware needs to be run before other middleware, so we expose an optional first argument which can be provided so explicitly send your middleware into express at various stages of the psychic configuration process. For example, to inject your middleware before cors and bodyParser are configured, provide `before-middleware` as the first argument. To initialize your middleware after the psychic default middleware, but before your routes have been processed, provide `after-middleware` as the first argument (or simply provide a callback function directly, since this is the default). To run after routes have been processed, provide `after-routes` as the first argument.

```ts
psy.use('before-middleware', (_, res) => {
  res.send('this will be run before psychic has configured any default middleware')
})

psy.use('after-middleware', (_, res) => {
  res.send('this will be run after psychic has configured default middleware')
})

psy.use('after-routes', (_, res) => {
  res.send('this will be run after psychic has processed all the routes in your conf/routes.ts file')
})
```

Additionally, a new overload has been added to all CRUD methods on the PsychicRouter class, enabling you to provide RequestHandler middleware directly to psychic, like so:

```ts
// conf/routes.ts

r.get('helloworld', (req, res, next) => {
  res.json({ hello: 'world' })
})
```
