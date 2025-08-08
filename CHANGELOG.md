## 1.6.1

- fix issue preventing validation fallbacks from properly overriding on OpenAPI decorator calls when explicitly opting out of validation

## 1.6.0

enables validation to be added to both openapi configurations, as well as to `OpenAPI` decorator calls, enabling the developer to granularly control validation logic for their endpoints.

To leverage global config:

```ts
// conf/app.ts
export default async (psy: PsychicApp) => {
  ...

  psy.set('openapi', {
    // ...
    validate: {
      headers: true,
      requestBody: true,
      query: true,
      responseBody: AppEnv.isTest,
    },
  })
}
```

To leverage endpoint config:

```ts
// controllers/PetsController
export default class PetsController {
  @OpenAPI(Pet, {
    ...
    validate: {
      headers: true,
      requestBody: true,
      query: true,
      responseBody: AppEnv.isTest,
    }
  })
  public async index() {
    ...
  }
}
```

This PR additionally formally introduces a new possible error type for 400 status codes, and to help distinguish, it also introduces a `type` field, which can be either `openapi` or `dream` to aid the developer in easily handling the various cases.

We have made a conscious decision to render openapi errors in the exact format that ajv returns, since it empowers the developer to utilize tools which can already respond to ajv errors.

For added flexibility, this PR includes the ability to provide configuration overrides for the ajv instance, as well as the ability to provide an initialization function to override ajv behavior, since much of the configuration for ajv is driven by method calls, rather than simple config.

```ts
// controllers/PetsController
export default class PetsController {
  @OpenAPI(Pet, {
    ...
    validate: {
      ajvOptions: {
        // this is off by default, but you will
        // always want to keep this off in prod
        // to avoid DoS vulnerabilities
        allErrors: AppEnv.isTest,

        // provide a custom init function to further
        // configure your ajv instance before validating
        init: ajv => {
          ajv.addFormat('myFormat', {
            type: 'string',
            validate: data => MY_FORMAT_REGEX.test(data),
          })
        }
      }
    }
  })
  public async index() {
    ...
  }
}
```

## 1.5.5

- ensure that openapi-typescript and typescript are not required dependencies when running migrations with --skip-sync flag

## 1.5.4

- fix issue when providing the `including` argument exclusively to an OpenAPI decorator's `requestBody`

## 1.5.3

- add missing peer dependency for openapi-typescript, allow BIGINT type when generating openapi-typescript bigints

## 1.5.2

- ensure that bigints are converted to number | string when generating openapi-typescript type files

## 1.5.1

- fix issue with enum syncing related to multi-db engine support regression

## 1.5.0

- add support for multiple database engines in dream

## 1.2.3

- add support for the connectionName argument when generating a resource

## 1.2.2

- bump supertest and express-session to close dependabot issues [53](https://github.com/rvohealth/psychic/security/dependabot/53), [56](https://github.com/rvohealth/psychic/security/dependabot/56), and [57](https://github.com/rvohealth/psychic/security/dependabot/57)

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
