## 1.14.0

- generated code uses absolute imports
- account for change in Dream in which `Virtual` decorator requires OpenAPI shape
- throw a more detailed error when DreamSerializer.attribute used to render a non-database, non-Virtual decorated property

## 1.13.0

- bump to Dream 1.12.0, which changes DateTime and CalendarDate to throw an exception rather than allowing invalid datetimes/dates

## 1.12.3

- fix setup:sync:openapi-redux and setup:sync:openapi-typescript cli
- include 404 in resource controller spec status code types
- default SameSite header to 'Strict'
- resource controllers generated with the `singular` flag load the resource with `firstOrFail()`, not `.findOrFail(this.castParam('id', 'string'))`

## 1.12.2

- when using `combining` in requestBody for an OpenAPI decorator, it will now override any params brought in through serializable introspection.

## 1.12.1

- increase depth of OpenAPI validation error logs
- fix generated resource controller spec

## 1.12.0

- `scrollPagination` support
- sort client enums when syncing to reduce needless diff churn
- leverage RequestBody in generated resource controller specs

## 1.11.1

- export PsychicLogos
- export colorize

## 1.11.0

- match Dream change from `bypassModelIntegrityCheck` to `bypassDreamIntegrityChecks`
- match Dream change to allow automatic OpenAPI generation from `delegatedAttribute` serialization of associated models
- fix resource controller spec generator missing date and datetime in spec ensuring model owned by another user is not updated
- resource controller spec generator supports array attributes
- generated resource controller spec data type `DreamRequestAttributes`, not `UpdateableProperties`
- call `.toISO()` on all DateTime and CalendarDate properties going into request to conform to types
- only pluralize the route if not designated as `singular`; pluralize before generating controller name so the controller name matches the route in the routes file
- increase depth of inspection during error logging

## 1.10.5

- add "combining" option to requestBody for OpenAPI decorator, enabling you to combine additional openapi fields to the request body, while still leveraging the powerful automatically-generated request body.
- syncing client enums now sync types along with values
- better dev logging

## 1.10.4

Fix issue with rendering incorrect enum descriptions when suppressResponseEnums is set to true and enums are explicitly overridden in the openapi option.

## 1.10.3

- respect `required: false` when generating OpenAPI spec

## 1.10.2

- return 400 instead of throwing error and 500 when there is a column overflow at the database level (let database validation suffice for enforcing data length validation rather than requiring model level validation)

## 1.10.1

- OpenAPI and castParam validation errors are logged only when `NODE_DEBUG=psychic`

## 1.10.0

- remove OpenAPI and Dream validation error response configuration and do not respond with errors (don't introduce such a difference between development and production environments)
- log validation errors in test and dev (not prod to avoid DOS)
- remove distinction between 400 and 422 to block ability of attacker to get feedback on how far into the system their request made it

## 1.9.0

1. Validate params against OpenAPI at the latest possible of:
   a. when the params are accessed
   b. when about to render the action
   This ensures that we return the proper 401/403 response instead of 400 for authenticated endpoints that fail authentication and prevents unauthenticated requests from gaining information about the API

2. Ability to configure whether or not OpenAPI validation errors include detailed information

## 1.8.6

remove dead env variable, now that we are open sourced

## 1.8.5

Do not hard crash when initializing a psychic application when one of the openapi routes is not found for an openapi-decorated controller endpoint. We will continue to raise this exception when building openapi specs, but not when booting up the psychic application, since one can define routes that are i.e. not available in certain environments, and we don't want this to cause hard crashes when our app boots in those environments.

## 1.8.4

- OpenAPI decorator with default 204 status does not throw an exception when passed a Dream model without a `serializers` getter
- OpenAPI decorator that defines an explicit OpenAPI shape for the default status code does not throw an exception when passed a Dream model without a `serializers` getter

## 1.8.3

- don't build openapi when `bypassModelIntegrityCheck: true`

## 1.8.2

- openapi validation properly coerces non-array query params to arrays when validating, since both express and ajv fail to do this under the hood properly. This solves issues where sending up array params with only a single item in them are not treated as arrays.

## 1.8.1

- do not coerce types in ajv when processing request or response bodies during validation. Type coercion will still happen for headers and query params, since they will need to respect the schema type specified in the openapi docuement.

## 1.8.0

- remove unused `clientRoot` config

## 1.7.2

- generate admin routes in routes.admin.ts (requires `routes.admin.ts` next to `routes.ts`)

## 1.7.1

- compute openapi doc during intiialization, rather than problematically reading from a file cache

## 1.7.0

- `sanitizeResponseJson` config to automatically escape `<`, `>`, `&`, `/`, `\`, `'`, and `"` unicode representations when rendering json to satisfy security reviews (e.g., a pentest report recently called this out on one of our applications). For all practical purposes, this doesn't protect against anything (now that we have the `nosniff` header) since `JSON.parse` on the other end restores the original, dangerous string. Modern front end web frameworks already handle safely displaying arbitrary content, so further sanitization generally isn't needed. This version does provide the `sanitizeString` function that could be used to sanitize individual strings, replacing the above characters with string representations of the unicode characters that will survive Psychic converting to json and then parsing that json (i.e.: `<` will end up as the string "\u003c")

- Fix openapi serializer fallback issue introduced in 1.6.3, where we mistakenly double render data that has already been serialized.

## 1.6.4

Raise an exception if attempting to import an openapi file during PsychicApp.init when in production. We will still swallow the exception in non-prod environments so that one can create a new openapi configuration and run sync without getting an error.

## 1.6.3

- castParam accepts raw openapi shapes as type arguments, correctly casting the result to an interface representing the provided openapi shape.

```ts
class MyController extends ApplicationController {
  public index() {
    const myParam = this.castParam('myParam', {
      type: 'array',
      items: {
        anyOf: [{ type: 'string' }, { type: 'number' }],
      },
    })
    myParam[0] // string | number
  }
}
```

- simplify the needlessly-robust new psychic router patterns by making expressApp optional, essentially reverting us back to the same psychic router we had prior to the recent openapi validation changes.

- fallback to serializer specified in openapi decorator before falling back to dream serializer when rendering dreams

## 1.6.2

fix OpenAPI spec generation by DRYing up generation of request and response body

## 1.6.1

fix issue preventing validation fallbacks from properly overriding on OpenAPI decorator calls when explicitly opting out of validation

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
