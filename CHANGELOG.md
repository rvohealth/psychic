## 3.16.0

- **Behavior change:** a deliberate 5xx is now a handled response whether it is thrown from a controller action or from middleware. A psychic `HttpError` with a 501–510 status (e.g. `this.serviceUnavailable()`, or `throw new HttpStatusServiceUnavailable(...)` in `psy.use` middleware) and an error from Koa's `ctx.throw` with a 501–510 status (e.g. `ctx.throw(503)`) are sent with their status, are not logged as server errors, and never reach `server:error` hooks. Previously, middleware 501–510 `HttpError`s and `ctx.throw` errors were logged as server errors and passed to `server:error` hooks (the generated hook then answered 500), and a controller `ctx.throw(503)` was logged and went through the hooks: a 500 with the generated hook, or, in an app with no `server:error` hooks, Koa's plain-text status phrase. A controller `ctx.throw(503)` now answers 503 with an empty body and no error log. A `ctx.throw` error's message and other properties are never sent; the headers passed to it, such as `Retry-After` in `ctx.throw(503, { headers: { 'Retry-After': '120' } })`, are still applied. When an error is passed to `ctx.throw`, as in `ctx.throw(503, caughtError)`, Koa keeps that error's own `status` (or `statusCode`) and uses the status passed only when the error has none, so a caught upstream error carrying a 401 (e.g. a stripe-node error for a rejected API key) is answered 401, as a quiet 4xx with no log and no `server:error` hook call, not 503; Psychic leaves that as Koa decides. Psychic never sends such an error's own `headers`, which an SDK error such as stripe-node's fills with the upstream response's headers (CORS, request ids, content type), and does not apply headers passed alongside it either, as in `ctx.throw(503, caughtError, { headers })`. For a deliberate status in a controller, use Psychic's helpers (e.g. `this.serviceUnavailable()`) instead of passing a caught error to `ctx.throw`. A 500 (`this.internalServerError()`, `ctx.throw(500)`), a non-HTTP exception, a `ctx.throw(511)`, and an uncaught error from any other library that merely carries a `status` (e.g. a Google API client error mirroring an upstream 503) are still logged and passed to `server:error` hooks. To have an error tracker see the upstream failure behind a deliberate 5xx, report the caught error yourself before throwing.
- **Behavior change:** in an app with no `server:error` hooks, Psychic now answers a server error thrown from a controller action itself, with a 500 and an empty body, instead of handing the error to Koa's default error handler. That handler crashed on Psychic's own `HttpStatusInternalServerError`, whose `status` it cannot set, and on a frozen error: `this.internalServerError()`, or a redirect Psychic refuses as unsafe (e.g. `this.redirect(returnTo)` to a host not in `redirectAllowedHosts`), got no response and left an unhandled rejection, which by default stops the Node process. Any other server error got Koa's plain-text response, with the error's own status when it carried one, and lost every header already set on the response, including the secure default headers, which are now kept. Psychic logs the error once; Koa's `'error'` event, which logged it a second time, no longer fires for it, and middleware around the router no longer sees it thrown, as already in an app with hooks. In development and test, an error a `server:error` hook throws is still re-thrown to Koa so that specs see it; when Koa cannot set its `status` (e.g. a hook re-throwing the `HttpStatusInternalServerError` it was given), Psychic now re-throws a plain `Error` with the original as its `cause`, which Koa answers with a 500, instead of crashing Koa's handler, whether the hook ran for an error from a controller action or from middleware.
- **Behavior change:** a server error from a controller action now answers 500 with an empty body when the app's `server:error` hooks set no response, as the hook documentation already promised. Psychic sets that default before the hooks run. Previously a hook that only reported the error (e.g. to an error tracker), or one that threw in production, left the 200 a controller starts with, so the client got 200 with Koa's `OK` body, or the success response the action had written with `this.ok(...)` before it threw. With the generated `server:error` hook, which sets only the status, a controller's server error now answers an empty body instead of Koa's `Internal Server Error` text, and a success body written before the throw is no longer sent with the 500. Hooks now run with `ctx.status` already 500 (it was 200 for a controller's error). A server error thrown outside a controller action (e.g. in `psy.use` middleware) is now answered 500 too, whatever status it carries, unless a hook sets another status: that includes Koa's `ctx.throw(511)`, previously sent as 511, and an uncaught error from another library that carries a 5xx status (e.g. a Google API client error mirroring an upstream 503), previously sent with that status; the generated hook already set 500 for both. An action or middleware that set `ctx.respond = false` (to write the response itself through `ctx.res`) and then threw before sending anything now gets this 500 too, and a deliberate error thrown that way, e.g. `this.notFound()`, `this.serviceUnavailable()` or `ctx.throw(401)`, now gets its own answer, as described in the deliberate 5xx and 4xx entries; previously the request got no response at all, except that a controller action's server error or `ctx.throw` error in an app with no `server:error` hooks went to Koa's default error handler, as described above. A response whose headers were already sent before the error is left as it was.
- Fix a server error thrown outside a controller action sending its data to the client. When `psy.use` middleware (or another layer outside the router, such as an after-routes mount) threw `HttpStatusInternalServerError` with data, e.g. `throw new HttpStatusInternalServerError({ secret })`, the 500's body was that data (JSON for an object, text for a string, a rendered serializer for a serializer) unless a `server:error` hook replaced the body. The generated hook sets only the status, so a generated app sent it. The data is now never sent, as `HttpStatusInternalServerError`'s documentation says and as a controller action already behaved: the 500 has an empty body unless a hook sets one, and an empty body that a hook sets no longer keeps the data's `application/json` content type. The error, with its data, is still logged and passed to `server:error` hooks. The data of an `HttpError` answered with its own status (a 4xx, or a 501–510) is still sent as the body, from a controller action or from middleware.
- Fix an error thrown on a request after Psychic answered a controller action's server error going to Koa's default error handler untouched. Once an action threw a server error, an error that middleware around the router threw later on that request, e.g. `psy.use` middleware throwing after `await next()`, skipped Psychic's handling: Koa sent the error's own status, its message when the error marked it as exposed, and its `headers` (e.g. an SDK error's copy of the upstream response's headers), and dropped the headers already set, including the secure default headers; the error was never passed to `server:error` hooks; and a psychic `HttpError` or a frozen error crashed Koa's handler, leaving the request without a response and an unhandled rejection, which by default stops the Node process. Such an error is now answered like any error thrown from middleware: a deliberate HTTP error (e.g. `ctx.throw(401)`) with its status, and anything else logged, passed to `server:error` hooks and answered 500 with an empty body. In development and test, an error a `server:error` hook throws is still re-thrown to Koa so that specs see it. An error thrown from middleware after the response headers were sent still goes to Koa's handler, which only logs it; a frozen one no longer crashes that handler.
- **Behavior change:** the errors answered as quiet 4xx responses are now the same whether they are thrown from a controller action or from middleware: a psychic `HttpError` with a 4xx status (e.g. `this.notFound()`), an error from Koa's `ctx.throw` with a 4xx status (including `ctx.assert` and the wrapped form, `ctx.throw(404, caughtError)`, which Koa answers with the caught error's own status when it carries one, as described in the deliberate 5xx entry above), and the body parser's own errors (e.g. a 400 for malformed JSON, or a 413 for a body over the size limit). They are sent with their status, are not logged as server errors, and never reach `server:error` hooks; a psychic `HttpError`'s data is sent as the body, as JSON, and the body is otherwise empty (as described in the next entry). A controller `ctx.throw(404, 'widget 42 not found')` was previously logged and passed to the hooks, so it answered 500 with the generated hook, or Koa's plain-text message in an app with no hooks; it now answers 404 with an empty body, as from middleware, and the message is never sent. The headers passed to `ctx.throw` with a 4xx status, such as `WWW-Authenticate` in `ctx.throw(401, { headers: { 'WWW-Authenticate': 'Bearer' } })`, are now applied on both paths; middleware dropped them before. An uncaught error from any other library that merely carries a 4xx `status` (e.g. an API client error mirroring an upstream 401 because the server's own credentials were rejected) is now a server error from middleware too: logged, passed to `server:error` hooks, and answered 500, as from a controller action with the generated hook. Previously middleware answered it with its own 4xx status, without a log or a hook call, so a broken upstream credential reached the client as a 401 instead of the error tracker. The body parser's errors are recognized by where they were thrown, not by their shape, so a `SyntaxError` with `status: 400` thrown from `psy.use` middleware is a server error as well, and so is an error thrown by the app's own `detectJSON` or `onError` callback (passed through `psy.set('json', …)`), although the body parser calls them while parsing the body; the body parser's own error, re-thrown by `onError`, is still answered with its status.
- **Behavior change:** a psychic `HttpError` answered with its own status (a 4xx, or a 501–510) now sends its data the same way from middleware as from a controller action: as JSON, with an `application/json` content type, and with an empty body when it has none (`undefined` or `null`). A string thrown from middleware, e.g. `throw new HttpStatusBadRequest('name is required')` in `psy.use` middleware, is now sent JSON-encoded, `"name is required"`, as a controller action's `this.badRequest('name is required')` already was; previously it was sent as it is, as `text/plain`, or as `text/html` when it began with `<`, as the 3.15.1 entry said ("Other data is still sent as is"). `0`, `false` and `''` are now sent as JSON from both: a controller action sent an empty body for each (e.g. `this.conflict(false)`), and middleware for `''`. An `HttpError` with `null` data thrown from middleware, e.g. `throw new HttpStatusUnauthorized(null)`, now answers its own status with an empty body, as from a controller action; previously it answered 204 No Content, a success status. Serializers passed as data are rendered as before: from a controller action with its serializer passthrough and, on an endpoint with `fastJsonStringify`, through the endpoint's response schema for that status; from middleware without either. On an endpoint with `fastJsonStringify`, only an object or array (a rendered serializer included) goes through that schema; a string, number or boolean is JSON-encoded as it is. Previously, through a schema describing an object, a string, a nonzero number or `true` (e.g. `this.conflict('taken')`) answered 500, logged a fast-json-stringify error such as `"reason" is required!` and called `server:error` hooks when the schema had a required property, and was sent as `{}` when it had none.
- Fix a request body that fails to decompress being answered as a server error. A body sent with a `gzip`, `deflate` or `br` `Content-Encoding` that is not valid compressed data (corrupt, cut short or empty, or a deflate body that needs a preset dictionary) was logged, passed to `server:error` hooks and answered 500, because the error zlib throws for it carries no status. It is now answered 400 with an empty body, without a log or a `server:error` hook call, like malformed JSON, including when the app's own `onError` callback (passed through `psy.set('json', …)`) re-throws the body parser's error. A failure on the server's side, such as zlib running out of memory, is still logged, passed to `server:error` hooks and answered 500, and so is a zlib-shaped error that the app's `onError` throws in place of the body parser's. An unsupported `Content-Encoding` is still answered 415.
- Fix `extractParams`, `paramsFor` and `Params.for` with `array: true` answering a malformed value with a 500. A value that is not an array of objects now raises `ParamValidationErrors`, which the router answers with a 400: a single object, a string, an object with numeric keys (what a form-encoded body becomes for a list indexed past 20), or an array containing `null`, a number, a string or another array. Previously these threw a plain `Error` or a `TypeError`, which was logged and passed to `server:error` hooks as a 500, except that array elements that were numbers, strings or arrays were silently turned into `{}`. A single value is never wrapped into an array. In a controller, a missing or null `key` with `array: true` now returns `[]`, as a missing key without `array: true` returns `{}`; previously it was a 500. `array: true` without a `key` now throws an error saying a `key` is required, since request params are always an object and there is no top-level array to read; it already failed on every request, with a less clear error.
- Fix controllers generated by `psy g:resource` casting the id as `'string'` whatever the app's primary key type. Once a developer uncommented the generated loader, a malformed id (e.g. `GET /v1/places/not-an-id`) reached Postgres, which rejected it, and the request answered a 500 and ran the `server:error` hooks. The generated loader now casts the id by the app's `primaryKeyType`: `this.castParam('id', 'bigint')` for `bigint` and `bigserial`, `'integer'` for `integer`, and `'uuid'` for `uuid`, `uuid4` and `uuid7`, so a malformed id is answered with a 400. An all-digit id too large for the column still reaches Postgres and answers a 500, and a uuid written in a form Postgres accepts but `castParam` does not (braced, or without hyphens) is now a 400. The `--owning-model` help for `psy g:resource` now says the id cast follows `primaryKeyType`, instead of showing `castParam('id', 'uuid')`, which did not match what the generator wrote.
- Fix `psy g:resource` writing a second copy of a namespace or parent-resource block into the routes file. The generator found an existing block only when every block on the route below the outermost was the first one in its parent, so adding a resource to an older sibling namespace (e.g. `v1/guest/reviews` after `v1/host/...` had been generated) or nesting under a parent that was not first wrote those blocks again beside the originals. A parent declared with options, e.g. `r.resources('places', { only: ['index', 'show'] })`, got an unrestricted duplicate `r.resources('places', r => { ... })` beside it, which routed the actions `only` excluded. Converting a bare parent `r.resources('places')` to the callback form could also empty a same-named parent in another namespace. The generator now finds each block on the route wherever it sits in its parent, writes only the blocks that are missing, and converts a parent to the callback form, keeping its options (`r.resources('places', { only: ['index', 'show'] }, r => {`), only when nesting the new resource in it. Running `g:resource` again for a resource the routes file already declares no longer adds a second declaration of it. When the run generates other actions (a different `--only`, or none), the existing declaration is changed in place to route them: its options become `{ only: [...] }` listing the actions the run generated, or none without `--only`, replacing any `only` and `except` it had, and a callback on it, with the routes nested in it, is kept. Previously the second declaration's actions were routed beside the first's, so narrowing a resource with `--only` left the actions it removed routed to the regenerated controller, which no longer had them, and they answered 404. An `--only` entry the resource has no action for (`index` with `--singular`, or a misspelled action) is left out of the route as it is left out of the controller; previously it was written into the routes file, where a singular resource's `index` could take the `GET` that `show` answers and answer it with a 404. A declaration already routing the run's actions, in any order or through `except`, is left as it is. The generator skips `/* ... */` block comments, so it never edits, nests into or counts a declaration commented out that way. A resource declared more than once on the route, or with options other than `only` and `except` lists of action names (e.g. a `controller`), is left unchanged, and the generator prints its declarations and the one to write. When a block on the route is declared in a form the generator does not edit (options spanning several lines, a call split across lines, a callback whose router is not named `r`), the routes function is indented with tabs, or no `(r: PsychicRouter)` routes function is found, it leaves the routes file unchanged and prints the route to add by hand, instead of writing a second block or, when no routes function was found, silently adding nothing.
- **Behavior change:** a `rendersOne` with a `serializer` override on an optional `BelongsTo` is now nullable in OpenAPI, as it already was without the override. For a `Place` with `@deco.BelongsTo('City', { optional: true })`, `.rendersOne('city', { serializer: CitySummarySerializer })` now renders `city` as `anyOf: [{ $ref: '#/components/schemas/CitySummary' }, { type: 'null' }]`, and with `flatten: true` it renders the flattened nullable form described in the next entry. Previously the override always rendered a bare `$ref`, so the generated client typed the association as non-null though the response sends `null` when it is absent, response validation rejected that `null`, and an endpoint with `fastJsonStringify` sent `{}` in its place. An explicit `optional` on the `rendersOne` still wins, so `optional: false` keeps the bare `$ref`. A `HasOne` is unchanged: whether it can be absent is not inferred, so pass `optional: true` when it can. Apps with this shape should re-run `psy sync`: the regenerated client types the association as nullable, which can surface type errors where frontend code reads it without a null check.
- **Behavior change:** a serializer attribute whose `openapi` is a serializer reference with `many` or `maybeNull`, e.g. `.customAttribute('rooms', () => ..., { openapi: { $serializer: RoomSerializer, many: true } })` or `{ $serializable: Room, maybeNull: true }` in an `attribute` or `delegatedAttribute`, now renders `many` as an array of the reference (`type: 'array'`, or `['array', 'null']` with `maybeNull` too) and `maybeNull` alone as `anyOf: [{ $ref }, { type: 'null' }]` (for an STI base model, `null` joins the `anyOf` of its children's references). Previously both were ignored and the document described a single object that could not be null, so the generated client typed the field wrongly, response validation rejected an array or a `null`, and an endpoint with `fastJsonStringify` sent a `null` as `{}` and failed on an array. In `@OpenAPI` shorthand, `{ $serializer: X, maybeNull: true }` (and a `$serializable` resolving to one serializer) rendered `allOf: [{ $ref }, { type: 'null' }]`, which no value matches; it now renders the same `anyOf`. A flattened serializer that can be null, i.e. a `rendersOne` with `flatten: true` that is `optional` (set, or inferred from an optional `BelongsTo`) and a `customAttribute` with `flatten: true` whose `openapi` is a `maybeNull` serializer reference, now renders inside the flattened `allOf` `anyOf: [{ allOf: [{ $ref }] }, { type: 'object', properties: { <each nested field>: { type: 'null' } } }]`: the nested serializer, or its fields absent or null. That is what is sent when the value is null: a flattened `rendersOne` sends the nested fields as `null`, and a flattened `customAttribute` leaves them out. A nested field that another attribute of the same serializer also renders is left out of that list, since it can hold that attribute's value. Previously a flattened optional `rendersOne` rendered `anyOf: [{ $ref }, { type: 'null' }]`, which a flattened object can never match as `null`, so response validation rejected a null association unless every nested field accepted `null`; a flattened `maybeNull` `customAttribute` was not nullable at all. Each `$ref` in an `anyOf` within a flattened `allOf`, including the children of an STI base model rendered by a flattened `rendersOne` or `$serializable`, is now wrapped in `allOf: [...]`, which validates the same. Previously an endpoint with `fastJsonStringify` sent none of the flattened fields when two such `anyOf`s met, e.g. a flattened STI association beside a flattened optional `rendersOne`. `flatten: true` with `many` renders as before (the reference alone). Apps using these shapes should re-run `psy sync`: client types for these fields become arrays or nullable.
- Fix an optional `delegatedAttribute` over an enum rendering an OpenAPI schema that rejects `null`. When a delegated attribute is optional (`optional: true`, or inferred from an optional `BelongsTo`), Psychic adds `null` to its schema's `type`, but it left the schema's `enum` or `const` as it was, so delegating a non-nullable enum column, or an STI `type`, through an optional association, e.g. `.delegatedAttribute('balloon', 'type')`, rendered `{ type: ['string', 'null'], enum: ['BalloonLatex', 'BalloonMylar'] }`, and response validation rejected the `null` sent when the association is absent. It now renders `enum: ['BalloonLatex', 'BalloonMylar', null]`, as a nullable enum column already does. The same applies to a hand-written `openapi` `enum`, including one over a nullable column whose `type` already allowed `null`, and a `const` now becomes an `enum` of its value and `null`. A hand-written `openapi` that applies a subschema beside its `type` (`allOf`, `anyOf`, `oneOf`, `not`, `if` or `$ref`), which can still reject `null` once the `type` allows it, now renders as `anyOf: [<schema>, { type: 'null' }]`. This was broken since 3.10.0. For an enum, the generated client types and `fastJsonStringify` output are unchanged, and response validation accepts the `null` once the app restarts. Apps with these fields should re-run `psy sync` to add the `null` to the committed document; `OpenApiSpecDiff` reports each one as `response-property-enum-value-added`.
- Fix a `description` or `summary` written beside an `allOf`, `anyOf` or `oneOf` in an OpenAPI shape being left out of the OpenAPI document. Both are now kept, in the components rendered for serializers, e.g. a serializer attribute's `openapi: { description: 'in cents, or a label', anyOf: [{ type: 'integer' }, { type: 'string' }] }`, and in inline `@OpenAPI` `responses` and `requestBody` schemas. A `description` beside a combinator in a `responses` entry, e.g. `responses: { 201: { description: 'the pet or its id', anyOf: [...] } }`, now appears in that response's schema, as it already does for an object-shaped entry; the response's own description is unchanged. Every other key beside a combinator is still left out, `type` included: a combinator applies to every value, `null` included, so `type: ['object', 'null']` beside an `anyOf` could never let `null` through. To make such a value nullable, list `{ type: 'null' }` as one of its branches: `anyOf: [<shape>, { type: 'null' }]`. Apps with these shapes should re-run `psy sync` to add the descriptions to the committed document.
- **Behavior change:** `setCookie`, on a controller or a `PsychicSession`, now honors `expires`: `this.setCookie('invitation', token, { expires })` sends a cookie that expires on that date. Previously Psychic sent a `maxAge` with every cookie (the call's own, else the app's `cookie` `maxAge` from `psy.set('cookie', ...)`, 14 days in a generated app, else 31 days), and the cookies library replaced `expires` with the expiry computed from it, so the cookie lasted that long instead. A cookie set with `expires` and no `maxAge` now gets no default `maxAge`, so an `expires` in the past deletes the cookie; code copied from the old `setCookie` TSDoc example, `{ expires: new Date('2025-12-31') }`, now sets a cookie that has already expired. When both are passed, `maxAge` still wins. An `expires` that is not a valid `Date` (e.g. `new Date('garbage')`) is ignored, as before. Cookies set without `expires`, including the session cookie `startSession` sets, are unchanged.
- Fix three descriptions in `psy g:resource --help` that did not match what the generators write. A namespaced `belongs_to` such as `Health/Coach:belongs_to` creates a `coach_id` column and a `coach` association, named for the last segment of the model name; the help said `health_coach_id`. The `Model@alias` example claimed the alias strips the namespace from the generated names, which the generator already does without one; it now shows an alias avoiding a collision, `Sports/Coach@sports_coach:belongs_to` beside `Health/Coach:belongs_to`, which would otherwise both create `coach_id`. `--sti-base-serializer` said both base serializers include the `type` attribute; only the default one does, when a `type` column is passed, and the summary, which the generated `index` action renders, includes only `id`. The same wrong lines in `psy g:model --help` and `psy g:migration --help` come from Dream and are unchanged.
- Fix the `@OpenAPI` option docs for `fastJsonStringify` and `security`. The `fastJsonStringify` doc said fast-json-stringify was on by default and that `true` switched to `JSON.stringify`. It is the reverse: the option defaults to `false`, and `true` serializes responses through the endpoint's OpenAPI response schema. The doc now also says what that changes (keys the schema does not declare are dropped, values that do not match it are coerced, and a missing required property throws) and that a status with no response schema is still serialized with `JSON.stringify`. The `security` example did not compile: `security` was shown as an object; it is an array of security requirements, `security: [{ customAuth: [] }]`. The doc now says that it applies to the endpoint instead of the document's `defaults.security`, that `security: []` documents an endpoint requiring none, and that Psychic does not enforce it. Behavior is unchanged.
- **Behavior change:** `this.respond(...)` now sends the success status the endpoint's OpenAPI document shows. An `@OpenAPI()` with no model, view model, serializer or `status` documents its success response as a 204 No Content, and `this.respond()` there now answers 204 with no body; previously it sent 200 with a `{}` JSON body (or the data passed), so a typed spec asserting the documented 204 failed, and a client generated from the document expected no content. A 204 cannot carry a body, so passing data on a 204, e.g. `this.respond({ id })` or `this.respond(null)`, now throws an error naming the controller and action, which is logged, passed to `server:error` hooks and answered 500, instead of the data being dropped; an explicit `status: 204` already sent 204 and silently dropped the data, and now throws too. When the decorator's `responses` declares a 200, 201 or 204, which replaces the success response Psychic generates, `this.respond(...)` now sends a status `responses` declares, with or without a model: e.g. `@OpenAPI(User, { responses: { 201: { ... } } })` now sends 201, not 200, and an explicit `status` that `responses` does not declare yields to the documented one. When the document shows several success statuses, `this.respond(...)` sends `status` when the document shows it, else 200 when the document shows a 200, else the lowest. A 2xx the document's `defaults.responses` adds to every endpoint counts as shown, unless the endpoint sets `omitDefaultResponses`: with a default 200, `this.respond(data)` on an `@OpenAPI()` with no model sends 200 with the data. A controller whose `openapiNames` puts it in several OpenAPI documents gets a success status every one of them shows, since its response is validated against each; a 2xx only some of them add is not sent. Endpoints with no `@OpenAPI` decorator, and those whose document shows a 200 (e.g. a model, view model or serializer with no `status`), still get 200; `this.ok(...)`, `this.created(...)`, `this.noContent()` and the other render helpers are unchanged. An endpoint that should send data with `this.respond(...)` needs a documented success response that carries it, e.g. a model, view model or serializer on the decorator, or a `responses` entry. The `respond` and `status` docs, which said `this.respond(...)` sends 200 when `status` is not passed, now say this, and the `status` doc now gives the document's defaults: a 200 when a model, view model or serializer is passed, and a 204 when none is.
- Fix the `psy.set('openapi', ...)` option docs for `defaults`, whose examples did not compile. The header example, shown three times (once in place of a `responses` example), gave a header `type` and `enum`; a header takes `required` and an optional `schema`, e.g. `locale: { required: false, schema: { type: 'string', enum: ['en-US', 'es-ES'] } }`. `security` was shown as an object; it is an array, `security: [{ myHttpAuth: [] }]`. The `securitySchemes` example was missing a comma, and the `components` example was not a schema. The `responses` doc said Psychic's default error responses include 422; they are 400, 401, 403, 404, 409 and 500, with no 422 because Psychic answers validation failures with a 400. It now shows a `responses` example in the rendered OpenAPI shape that `defaults.responses` takes (a `$ref` to a response defined in `components.responses`, or a `description`), not the `@OpenAPI` decorator's shorthand. The `info` example's `version` is now a string, and the `suppressResponseEnums` example for a named document now passes the `outputFilepath` a named document requires. Behavior is unchanged.
- Fix `PsychicApp`'s `jsonOptions`, `corsOptions` and `cookieOptions` getters being typed as always returning options. Each returns `undefined` when the app never calls `psy.set('json', …)`, `psy.set('cors', …)` or `psy.set('cookie', …)`, and is now typed that way, so code that reads a property of one without handling `undefined`, e.g. `PsychicApp.getOrFail().jsonOptions.jsonLimit`, is a compile error instead of a `TypeError` at runtime in an app that never set the option. The `BodyParserOptions` type is unchanged. Only the types changed; behavior is unchanged.
- Fix the `castParam` doc for `allowNull` with dot notation. It said, as did the 3.13.0 note, that an absent value at any depth returns `undefined` except with the `'null'` expected type, which returns `null`. That exception holds only for an absent leaf. An absent dot-notation intermediate returns `undefined` for every expected type, including `'null'` and OpenAPI schemas: `this.castParam('user.role', 'null', { allowNull: true })` returns `undefined` when the request has no `user`, and `null` when it has a `user` with no `role`. The doc now says so, and also says that a `null` intermediate, like an array or any other non-object one, is invalid dot notation and raises `ParamValidationError` even with `allowNull`. Behavior is unchanged.
- Add `psy resolve-aliases`, which rewrites the tsconfig `paths` aliases that `tsc` leaves in its output (e.g. `import '@conf/loadEnv.js'`) to relative paths, so that `node` can run the build. Apps generated by create-psychic 3.1.0 or later build without rewriting them, so `node dist/src/main.js`, `psy:js` and `console:js` fail with `ERR_MODULE_NOT_FOUND`. To fix such an app, run the command after `tsc` in its `build` script, with the same tsconfig, through the app's package manager, e.g. `pnpm tsc -p ./tsconfig.build.json && pnpm psy resolve-aliases -p ./tsconfig.build.json`, and likewise with `./tsconfig.build-spec.json` in `build:spec`. `psy` is the app's package.json script, not an executable: yarn runs it as `yarn psy resolve-aliases -p …` and bun as `bun run psy resolve-aliases -p …`, while npm needs `--` before the command, or it keeps `-p` for itself: `npm run psy -- resolve-aliases -p ./tsconfig.build.json`. An app that worked around this with a `tsc-alias` step (e.g. in its Dockerfile) can replace that step with the command. It reads the tsconfig as `tsc` does (honoring `extends`), finds imports with TypeScript's parser and resolves them with TypeScript's module resolution, and rewrites static, side-effect, `export … from`, dynamic and `require` imports in the emitted `.js` and `.d.ts` files; text that only looks like an import (in a string, a comment, or the argument of a method named `require`, such as `module.require(…)`), relative imports, packages, and imports that resolve to no file the build emitted are left unchanged, so running it again changes nothing. It does not initialize the app, so it needs no database connection.
- Fix the i18n function from `I18nProvider.provide` interpolating values incorrectly. It replaced only the first occurrence of each placeholder, so `'%{name} booked %{place}. Thanks, %{name}!'` with `{ name: 'Bruno', place: 'Denver' }` rendered `Thanks, %{name}!`; it expanded `$` replacement patterns in a value, so `{ price: '$$5' }` rendered `$5` and `$&` or `$'` pulled in parts of the translation; and a value containing another placeholder, such as `{ name: '%{place}' }`, was itself interpolated. Every occurrence of a placeholder is now replaced, and each value is inserted exactly as given, as the `provide` doc already said. A placeholder with no supplied value is still left as written, and an `undefined` or `null` value still throws. **Behavior change:** a placeholder is `%{`, a name containing neither `{` nor `}`, and a closing `}`, so an interpolation key containing a brace (`{` or `}`), such as `{ 'a}b': 'x' }` or `{ 'a{b': 'x' }`, now throws an error naming the key; a `}` key previously replaced the first `%{a}b}` in the translation. A literal `%{` with no closing brace, as in `'Type %{ to insert a variable, %{name}'`, stays as written and the placeholder after it is still interpolated.
- **Behavior change:** `validate: { all: false }` in `psy.set('openapi', ...)` now turns validation off even when a per-target flag is set, as it already did in an `@OpenAPI` decorator's `validate` option. `{ all: false, requestBody: true }` used to validate request bodies at the app level, because only `all: true` had an effect there; it now validates nothing. An explicitly set `all` overrides `requestBody`, `responseBody`, `headers` and `query` wherever `validate` is given. To validate only some targets, leave `all` out and set those flags. `{ all: true }` and per-target flags without `all` behave as before, and an `@OpenAPI` decorator's `validate` still overrides the app's.
- **Behavior change:** `getCookie`, on a controller or a `PsychicSession`, now returns `null` for a cookie whose value cannot be decrypted (tampered with, garbage, or encrypted with a key that is neither the current nor the legacy cookie key), as it does for a missing cookie, and logs a warning naming the cookie and the error class, never the value. The cookie is left in place. Previously the `DecryptionError` or `DecryptionRotationError` from `@rvoh/dream` propagated to the app, by design, so any client could send `Cookie: auth_token=garbage` to an action that reads a cookie and get a 500; an authenticating before-action now answers it as logged out (e.g. 401). This reverses that earlier "decryption errors propagate" behavior. Errors that point at an app or configuration bug still throw: a `DecryptionParseError` (the value decrypted but is not JSON) and a configured current or legacy key of the wrong length when the cookie value is well formed. A malformed value fails before the key is used, so it is read as absent even under such a key; a production app with a wrong-length key fails at boot, and other environments only warn.
- **Behavior change:** the i18n function from `I18nProvider.provide` now falls back to the base locale, the `singleLocaleKey` passed to `provide` (e.g. `'en'`), for a key missing from the requested locale. With an `es` file that lacks `places.style.cottage`, `i18n('es-ES', 'places.style.cottage')` now returns the base locale's text, interpolated as usual, instead of the dotted key `'places.style.cottage'`; a key missing from both still returns the dotted key. A locale whose language `allLocales` lacks (e.g. `'de-DE'`), or a missing locale, now falls back to the base locale's file rather than to a hardcoded `en` file. An app whose base locale is `en` sees no change; an app whose base locale is not `en` now gets the base locale's text there, where it used to get the `en` file's text, or a `TypeError` when it had no `en` file. A key now resolves only when its full path does: a string at an ancestor of the key (an `es` file with `account: 'Cuenta'` asked for `account.title`) is no longer returned as the translation, and the lookup falls back to the base locale.
- Add `I18nProvider.localeDifferences(allLocales, singleLocaleKey)`, which compares every locale with the base locale and returns one readable line per difference: a missing key, a key the base locale lacks, a string where the other has nested translations, and a translation whose `%{…}` placeholders differ from the base's. It returns `[]` when every locale matches. Psychic never runs it; call it from a spec with the arguments you pass to `provide`, e.g. `expect(I18nProvider.localeDifferences(locales, 'en')).toEqual([])`, to catch a locale that would fall back before a user sees it.

## 3.15.3

- Set the development Node.js types to Node 26 while retaining runtime compatibility with Node 24 and newer. Node 26 is now the primary CI and release runtime, with Node 24 retained in the build, lint, and unit test matrix.

## 3.15.2

- Update Ajv, fast-json-stringify, and Supertest; refresh the dependency graph to resolve the fast-uri and qs security advisories.

## 3.15.1

- Fix serializer builders being sent without being rendered. Passing a serializer to an error helper, e.g. `this.conflict(BookingConflictSerializer(booking))`, or to `this.nonAuthoritativeInformation(...)` (203), sent the builder's internals to the client instead of the rendered body. That included every attribute of the underlying model, whatever the serializer exposed. The same happened when middleware (e.g. `psy.use`) threw an `HttpStatus*` error carrying a serializer. Serializer builders, and arrays of them, are now rendered. From a controller they are rendered the same way success responses render them: with the controller's `serializerPassthrough` data and render options, with or without `fastJsonStringify`. This matches an `@OpenAPI` `responses: { 409: { $serializer: BookingConflictSerializer } }` declaration. From middleware there is no controller, so they are rendered without passthrough data. `this.internalServerError(...)` is unchanged: its data is never sent. Other data is still sent as is.
- Export `OpenapiResponsesOption` from `@rvoh/psychic/openapi`: the type of the `@OpenAPI` decorator's `responses` option. Annotate a `responses` object shared across several actions with it, e.g. `const conflictResponses: OpenapiResponsesOption = { 409: { $serializer: BookingConflictSerializer } }`, so it is accepted by `@OpenAPI(..., { responses: conflictResponses })`. The existing `OpenapiResponses` export is the rendered OpenAPI document's shape, not the decorator's input, and is now documented as such.

## 3.15.0

- Map Dream's `CannotSaveMissingDream` to HTTP `404`, matching `RecordNotFound`, when a persisted record is deleted before a concurrent update saves it. Requires `@rvoh/dream` `^2.31.0`.

## 3.14.0

- Removed `MissingControllerActionPairingInRoutes` from the `@rvoh/psychic/openapi` exports. It is an internal control-flow signal, thrown by the OpenAPI endpoint renderer when an `@OpenAPI`-decorated method has no matching route and caught by the OpenAPI document generator to implement `bypassMissingRoutes`. Psychic applications have no reason to throw it and no code path that can usefully catch it, so its export was accidental surface rather than public API. The class itself is unchanged and still reported in the same way — an `@OpenAPI` decorator with no matching route still fails with the same message — only the export is gone.

## 3.13.0

- **Behavior change:** `castParam` with `allowNull: true` now consistently preserves nullish input for primitive-literal and RegExp expected types: an absent value at any depth returns `undefined`, except when the expected type is `'null'`, which returns `null` because null is the requested type; an explicitly `null` leaf returns `null`. Previously, an absent dot-notation intermediate returned `null`, and direct RegExp validators rejected nullish leaves despite `allowNull`. This preserves the distinction between omission and explicit clearing in partial updates and makes direct RegExp validators behave like the equivalent string `match` option. Callers that relied on an absent nested object producing `null` should handle `undefined` instead. A `null` dot-notation intermediate remains invalid input, but now produces `ParamValidationError` rather than allowing a `TypeError` to escape. OpenAPI-schema leaves remain governed by their schema.

## 3.12.0

- **Behavior change:** client enum syncing is now OpenAPI-driven and per-spec, replacing the pg-catalog dump that exported every database enum (and required a live database). `setup:sync:enums` now takes named arguments instead of a positional outfile — `setup:sync:enums <outfile>` becomes `setup:sync:enums --openapi-name=<name> --output-file=<path>` (`--openapi-name` is optional and defaults to `'default'`; old positional invocations fail loudly) — and the generated initializer bakes the chosen spec name into its `PsychicBin.syncClientEnums` call.
  - The synced enums file now contains only the enums reachable from the selected spec's rendered surface (serializer attributes and model-derived request bodies), and each export carries only the spec-visible value set — the union of the values that spec's sites actually render. Enums with no pg type name (hand-written serializer enum shapes, virtual columns, `@OpenAPI` blocks) and values hidden by serializer `enum:` overrides are no longer exported. Consequently, previously exported consts and values can vanish from the enums file on the first re-sync with no change to how you invoke anything — review the diff of your synced enums file after upgrading.
  - Enum collection renders the spec in memory: the enum sync itself needs no database connection, and specs with `suppressResponseEnums: true` still export real enum values (collection happens upstream of suppression).
  - Existing generated initializers calling `syncClientEnums(outfile)` keep working and sync the `'default'` spec. An unregistered OpenAPI spec name fails loudly — before anything is written — with the registered names listed, in both the setup command and `syncClientEnums` (previously an unknown name would have silently produced an empty enums file).
  - The generated initializer's filename is derived from the spec, the way the zustand/redux setup commands derive theirs from `--export-name`: the `'default'` spec generates `sync-enums.ts`, any other spec generates `sync-enums-<name>.ts`. `setup:sync:enums` takes no `--initializer-filename` option — an app with one front end per OpenAPI spec runs the setup once per spec, each with its own `--output-file`, and each run owns its own initializer (two initializers pointed at the same output file will overwrite each other on every sync).
  - Re-running `setup:sync:enums` for the same spec when its generated initializer already exists with different content now prompts for confirmation and overwrites on yes, instead of silently leaving the old initializer in place (byte-identical re-runs still silently no-op; without a TTY, or with the prompt bypassed, the command fails with a clear message naming the existing file). Pass `--overwrite` to pre-give that consent for non-interactive use (agents, CI).
- Fixed `--initializer-filename` being ignored by `setup:sync:openapi-typescript`: the action destructured the option under the wrong name, so its value was always `undefined` and the default initializer filename was always used. The adjacent wrong `.d.ts` template-literal cast (the generator expects a `.ts` initializer filename) is reconciled as part of the fix. Known limitation: a re-run with a different `--initializer-filename` sees no existing file, prompts nothing, and leaves the previous initializer's `cli:sync` hook live — remove the superseded initializer manually to avoid double-syncing.
- The synced enums file's exported type per enum drops its `Values` suffix: the type formerly emitted as `BalloonColorsEnumValues` is now `BalloonColorsEnum`, matching Dream's `db.ts` convention (the intended suffix-strip regex in the generator never matched). The const `BalloonColorsEnumValues` survives unchanged — value imports and `(typeof BalloonColorsEnumValues)[number]` still compile — so only type-position annotations of the old name break. Migration: `const color: BalloonColorsEnumValues` → `const color: BalloonColorsEnum`.
- **Behavior change:** every `setup:sync:...` command (`setup:sync:openapi-redux`, `setup:sync:openapi-zustand`, `setup:sync:openapi-typescript`) now prompts once, before writing anything, when a re-run would overwrite existing files with different content — listing every affected path. This replaces two silent prior behaviors: silently skipping existing files (the redux initializer and api file, and the zustand client config, kept their old content on re-run — leaving them out of step with the freshly rewritten redux codegen JSON) and silently overwriting them (the openapi-typescript initializer and the redux codegen JSON were replaced with no prompt). Declining leaves all files untouched, byte-identical re-runs silently no-op, and without a TTY (or with the prompt bypassed) the commands fail with a clear message before any write — so `setup:sync:openapi-typescript` (and fully-specified `setup:sync:openapi-redux`/`setup:sync:openapi-zustand`) re-runs that succeed unattended today start erroring in non-interactive contexts; each command accepts `--overwrite` to pre-give the consent the prompt would ask for (the error text names the flag), replacing differing files without prompting. Confirming overwrites the user-customizable scaffolds (the redux api file and the zustand client config, which typically carry your baseUrl/auth code), discarding any local edits. The renamed-target limitation noted above applies to these commands too: changing `setup:sync:openapi-typescript`'s `--initializer-filename` or the redux/zustand `--export-name` renames the targets, skips the confirmation, and leaves the old initializer's `cli:sync` hook live.

## 3.11.3

- Psychic's two `paramSafeColumnsOrFallback` call sites now reach the member through a typed bracket-access back-door — cast to `(this: T) => string[]` and invoked with an explicit receiver — so psychic keeps compiling and linting when dream makes `Dream.paramSafeColumnsOrFallback` `private static` (dream 2.26.0, closing the explicit route back to advertising a model's whole writable surface in OpenAPI request bodies). No consumer-observable behavior change. Also corrects a stale dream line-range citation in a `paramSafeColumnNamesFromCliTokens.ts` comment. (Shipped in #532, which landed without a bump; this release carries it.)

## 3.11.2

- Errors thrown while generating the per-`openapiName` OpenAPI cache during `PsychicApp.init` (e.g. a serializer misconfiguration) are now wrapped with context naming the step and the failing document — "Failed to generate the OpenAPI document 'default' during PsychicApp.init." — with the original error preserved via `{ cause }` (and its message embedded). Previously the underlying error propagated raw, with nothing tying it to OpenAPI generation or identifying which document failed. Other documents and the success path are unchanged.

## 3.11.1

- Added `boolean` / `boolean[]` to the "supported types" list in `baseColumnsWithTypesDescription` (`g:resource --help` and other generators sharing this help text), which previously documented every other column shorthand type except `boolean` even though it is a fully-supported column type.

## 3.11.0

- `psy diff:openapi --fail-on-breaking` now exits nonzero when the diff tooling itself fails (oasdiff invocation error, spec file missing on the current branch, head-branch spec unreadable), instead of reporting "no breaking changes" and passing the CI gate. Tool failures throw a new `OpenApiSpecDiffToolFailureError` whose message explicitly distinguishes "the diff tool failed (inconclusive)" from "breaking changes found". Failed oasdiff invocations are now propagated as structured errors rather than string-matched on `'Command failed'`, and a failed head-branch retrieval for one file is recorded as that file's error (other files are still compared) instead of aborting the whole run with a raw error. Without `--fail-on-breaking` (informational mode), tool failures are printed loudly but the exit code is unchanged. A genuine no-changes run still exits 0, and the breaking-changes path is unchanged.
- Server lifecycle correctness:
  - `PsychicServer#start` now rejects when the underlying `listen` fails (e.g. `EADDRINUSE`, `EACCES`). Previously the bind error escaped as an uncaught `'error'` event and the start promise hung unsettled forever.
  - SIGINT/SIGTERM graceful shutdown can no longer hang or leave the process alive: shutdown is bounded by a 15s timeout (`PsychicServer.SHUTDOWN_TIMEOUT_MS`); a failing or hung `server:shutdown` hook (or db close) logs at error level and exits with code 1; a clean shutdown still exits 0. Previously a rejecting shutdown hook was an unhandled rejection that could leave the process ignoring subsequent SIGTERMs, and the exit code was always 0 even after partial shutdown failure.
  - `PsychicServer#boot` failure rethrows now preserve the original error via `{ cause }` instead of dropping its class and stack.
- `server:error` hooks now cover errors raised outside the router. Psychic mounts an error-boundary middleware outermost in the Koa middleware stack, so errors thrown from the body parser, cors callbacks, custom `psy.use` middleware, and after-routes mounts are captured and escalated to `server:error` hooks (awaited, with response control via `ctx`) instead of following Koa's default path, where the hooks never ran. Errors carrying a 4xx status (e.g. a body-parser 400, or an `HttpError` thrown from custom middleware) render as that status — honoring `HttpError#data` as the response body — and never reach the hooks. Errors thrown from controller actions are processed by the router exactly as before, and a single request can never run `server:error` hooks twice. Psychic also registers a minimal app-level `'error'` listener so the residual errors Koa surfaces outside the boundary (errors thrown after headers were sent, response-stream failures) are logged through the configured psychic logger. NOTE (existing behavior, now documented): once any `server:error` hook is registered, psychic considers the error handled and does not re-throw it to Koa.

## 3.10.1

- Tightened the inferred return type for `Params.for`, `Params.extract`, `PsychicController#paramsFor`, and `PsychicController#extractParams` so optional extracted keys no longer also include `undefined` in their value unions. This matches runtime behavior, where missing or explicitly `undefined` request values are omitted from the returned object. Nullable columns still infer `T | null`, and `{ array: true }` returns the same tightened element type for nested model-array request bodies.

## 3.10.0

- Security hardening (audit 2026-07-01):
  - `castParam` / `Params.cast` gained `maxLength`/`minLength` (for `string`) and `minimum`/`maximum` (for `number`/`integer`/`bigint`) options so the request-boundary enforcer can express length and numeric-range bounds, not just `enum`/`allowNull`/`match`. Constraints are applied after type coercion and throw `ParamValidationError` on violation; option names mirror JSON-schema/OpenAPI. For array casts (`string[]`, `integer[]`, etc.) the bounds are enforced element-wise, and `bigint` range checks compare without precision loss.
  - Tightened numeric coercion in `castParam` / `Params.cast`. BEHAVIOR CHANGE (these inputs now return `400` instead of coercing): `number` casts reject non-finite and non-decimal string forms — `"Infinity"`, `"NaN"`, magnitude overflows like `"1e999"` (which `Number()` turned into `Infinity`), and hex/octal/binary literals like `"0x10"` (which coerced to `16`); a non-finite JS `number` value is likewise rejected. `integer` casts reject values outside the JavaScript safe-integer range instead of silently rounding a long digit string (e.g. a 40-digit number) to a nearby float — cast such values as `bigint` to preserve them exactly. Ordinary decimals, floats, scientific notation (`"1e3"`), and normal integers are unaffected, and `bigint` still handles arbitrarily large values.
  - Fixed `Params.for` throwing an uncaught `TypeError` (HTTP `500`) when an array-enum column received a non-array value instead of an array. The branch set an error message but neither returned nor threw, then ran `.map` on the non-array. It now rejects a non-array value with a `400` `ParamValidationErrors` (`expected an array of enum values`); a proper array still has each element validated against the enum. Single-value query arrays are conformed to arrays upstream in `conformQueryArrayParamsToOpenapiShape`, so no coercion is performed on this mass-assignment path.
  - `PsychicApp.init` now validates the `legacy` cookie encryption key (`encryption.cookies.legacy`) at boot when present, using the same fail-closed-in-production check already applied to `current`. Previously only `current` was validated, so a malformed `legacy` key passed boot and only surfaced as a runtime `500` at the first legacy-fallback cookie decryption. The boot error now names whether the `current` or `legacy` key is invalid.

## 3.9.0

- BREAKING: model-derived `@OpenAPI` request bodies no longer implicitly advertise every param-safe column. When a model-derived `requestBody` is given no `params`/`only` (and no `combining`/`required`/pagination body param), the default is now to advertise NO model columns: a top-level model-derived `requestBody` is omitted entirely, and a nested `{ for: Model }` sentinel renders an empty object. This prevents database-level structure from leaking into the generated OpenAPI shape by default. Endpoints that should advertise settable columns must now list them explicitly via `requestBody: { params: [...] }`. Explicit `params`/`only` behavior is unchanged, and the runtime `paramsFor`/`extractParams` allowlists are unaffected.
- Added an opt-in `legacyImplicitRequestBodyParams` flag on the OpenAPI config (covering both the default and named specs) that restores the previous implicit-all behavior. It is a deprecated escape hatch intended to ease migration.

## 3.8.6

- Fix hand-written OpenAPI response schemas using `$serializable` with an STI base model so they now emit the same `anyOf` union of child serializers that serializer-derived rendering already produces. Non-STI `$serializable` responses and STI keys that resolve to one shared serializer keep their existing single `$ref` shape.

## 3.8.5

- Remove the default `ValidationErrors` OpenAPI response component and document `400` as the preferred status for deliberate user-facing validation error payloads. Psychic still supports explicit `422` responses and `unprocessableContent(...)`; automatic validation rescue paths continue to return bare `400` responses.

## 3.8.4

- String array params now trim each string element before validation/casting, matching scalar string params. This fixes enum-backed string arrays in `castParam`, `extractParams`, and `Params.for` rejecting otherwise-valid values with leading or trailing whitespace.

## 3.8.3

- upgrade to pnpm@11.9.0; add strictDepBuilds: false and deny esbuild/puppeteer build scripts in pnpm-workspace.yaml

## 3.8.2

- switch to Github action publishing to npmjs.com

## 3.8.1

- OpenAPI generation no longer advertises `422` ValidationErrors as a default response on every endpoint. Psychic's automatic validation rescue paths for Dream validation errors, OpenAPI request validation failures, and param validation errors return `400` by design; `422` remains available only when an endpoint explicitly raises it, such as through `unprocessableContent(...)`.

## 3.8.0

- `Params.for` and `PsychicController#extractParams` now cast and validate Dream virtual columns, including `@Encrypted` fields, from their declared OpenAPI metadata instead of passing them through unchecked. This makes virtual param handling match concrete Dream columns: `@Virtual(['string', 'null'])` and nullable `@Encrypted` params reject non-strings while allowing `null`, and virtual array shorthands such as `string[]` are cast through the same array path used for database-backed array columns.
- `@OpenAPI` model-derived `requestBody` allowlists now use `params` as the canonical key (`requestBody: { params: paramSafeColumns }`) to match the explicit `extractParams(Model, paramSafeColumns)` flow. The previous `only` key still works as a deprecated compatibility alias, including inside nested `{ for: Model }` request-body shorthand and `OpenAPI.forDream(Model, ...)`, but newly generated `create` / `update` scaffolds emit `params` so the documented request shape and runtime extraction call both read as explicit request params.

## 3.7.0

- `g:resource` controllers generated in the `internal` namespace now scope queries to the authenticated internal user the same way default-namespace controllers scope to the current user — `this.currentInternalUser.associationQuery('posts')` / `this.currentInternalUser.createAssociation('posts', …)` — instead of reaching every record in the system via direct model access. Previously the `internal` namespace was treated identically to `admin`, lifting all owner scoping; that meant a generated internal resource defaulted to letting any authenticated internal user read and mutate any record, an unsafe default for a scaffold. The `admin` namespace is unchanged (still unscoped by default), and supplying `--owning-model` still scopes to that model in either namespace. The generated resource spec gains the matching "created by another InternalUser" omission/not-found/not-updated/not-deleted contexts. Generated scaffolds are emitted commented-out, so this only affects newly generated code — no runtime behavior in existing apps changes.

## 3.6.0

- Migrate the JSON/body middleware from the legacy `koa-bodyparser` to the officially-maintained `@koa/bodyparser` (`^6.1.0`), keeping psychic current with the koa org's supported packages. `@koa/bodyparser` ships its own types, so the `@types/koa-bodyparser` peer/dev dependency is dropped. The unused `@types/koa-etag` peer/dev dependency is also removed (psychic imports `@koa/etag`, which self-types; `koa-etag` was never imported).
  - **Breaking (only if you set `psy.set('json', …)`):** the options object is now `@koa/bodyparser`'s, so the error hook is `onError` (was `onerror`) and `ctx.request.body` is typed `unknown` (was `any`). The common limit/type options (`jsonLimit`, `formLimit`, `textLimit`, `xmlLimit`, `enableTypes`, `jsonStrict`, `detectJSON`) are unchanged. Apps that don't configure `json` are unaffected. The publicly-exported options type is now `BodyParserOptions` (derived from the middleware signature), replacing the old `bodyParser.Options` namespace type.

## 3.5.0

- `PackageManager` — used by the CLI to spawn package-manager subprocesses during `sync` (run by `db:migrate`/`db:reset`), generators, and setup commands — now emits correct commands for `bun` and `deno` alongside pnpm/yarn/npm: `run` → `bun run <cmd>` / `deno task <cmd>`; `exec` → `bunx` / `deno run -A npm:<bin>`; `add` → `bun add` / `deno add` (with `npm:` specifier prefixing). The prior `<pm> <cmd>` default fit pnpm/yarn but produced e.g. `deno post-sync`, which Deno reads as a file path (→ "Module not found"), breaking `sync` under Deno. Enables `@rvoh/create-psychic` to scaffold Bun/Deno apps. Requires `@rvoh/dream` ≥ 2.12.0 in the consuming app (its package-manager enum must list bun/deno).

## 3.4.2

Fixes a graceful-shutdown hang in `PsychicServer.stop()`.

- `stop()` previously called `httpServer.close()` without awaiting it and without terminating open sockets, then immediately `await closeAllDbConnections()`. `http.Server.close()` only stops accepting _new_ connections; existing keep-alive sockets (browsers, `fetch` agents, reverse proxies behind a load balancer) stay open and keep their request handlers — and any resources those requests leased, such as database pool clients — alive. `closeAllDbConnections()` → `pool.end()` then blocks until those leased clients are released, which never happens while the sockets are open. In production this could stall a SIGTERM drain until the orchestrator force-kills the process; in feature specs it manifested as an `afterAll` that hangs for the full hook timeout.
- `stop()` now awaits `httpServer.close()` and **gracefully** drains: it immediately calls `httpServer.closeIdleConnections()` (Node ≥ 18.2) to drop only the _idle_ keep-alive sockets that were keeping `close()`'s callback from firing — without aborting in-flight requests — then allows a bounded grace period (`gracefulShutdownTimeoutMillis`, default `10_000`, settable via `stop({ gracefulShutdownTimeoutMillis })`) for active handlers to finish, and only then calls `httpServer.closeAllConnections()` as a last resort so shutdown can never hang forever. The server is fully closed — and in-flight requests have released their pooled resources — _before_ the database connections are torn down, which also eliminates the spurious "driver has already been destroyed" errors. On Node runtimes without `closeIdle/AllConnections` the optional calls no-op and prior behavior is retained. (Initial revision force-closed _all_ sockets immediately, which aborted legitimate in-flight requests on a normal SIGTERM drain — corrected per review to idle-first + bounded grace.)

## 3.4.1

Follows up on the 3.2.0 mass-assignment work by collapsing to a single canonical extractor. The `SECURITY_LEARNINGS_2026-05-12` retrospective concluded that an implicit-allowlist primitive whose safe usage depends on a documented rule is the same shape Rails removed in 2012 — and that the admin-ergonomics steelman (the only argument for keeping it) is structurally covered by the shared `paramSafeColumns` const the generator now emits. Since 3.2.0 shipped only days ago, removing outright rather than carrying a deprecation tag is safe.

- `PsychicController.extractImplicitParams` and the underlying `Params.extractImplicit` static are **removed**. Migrate to `extractParams(Model, [...allowlist])` — the explicit-allowlist form keeps the permitted columns visible at the call site.
- `psy g:resource` / `psy g:controller` scaffolds now emit `this.extractParams(Model, paramSafeColumns)` in **both** admin and non-admin namespaces. The `paramSafeColumns` is a single `DreamParamSafeColumnNames<Model>[]`-typed array declared at the top of the file (alongside `openApiTags`) and referenced from both the `create` and `update` action hints — one editable list per controller instead of duplicated inline arrays at each call site, and no admin/non-admin branch to remember. The explicit model-column type (rather than `as const`) gives autocomplete of valid columns and a compile error on anything not param-safe, directly in the array literal.
- The `--with-extract-params` and `--with-extract-implicit-params` CLI flags on `psy g:resource` are **removed**. With one canonical path there is nothing to override; commander will reject either flag with `error: unknown option`.
- Generated `create` / `update` scaffolds now also narrow the `@OpenAPI` decorator's `requestBody` to the same `paramSafeColumns` const (`requestBody: { only: paramSafeColumns }`). The documented request body and the runtime `extractParams` allowlist track each other from a single edit point — editing the const updates both the params actually accepted and the OpenAPI shape, so they cannot silently diverge.

## 3.4.0

- improvements to `psy g:resource`'s `belongs_to` shorthand

## 3.3.0

- recursive Dream-model-driven request bodies via a nested `for:` sentinel inside `requestBody.combining` / `properties` / `items` — produces an inline object schema derived from the model's param-safe columns, recurses through further `combining`, and is request-only (response shorthand still uses `$serializable` / `$serializer`)
- `OpenAPI.forDream(Model, opts)` helper with column-level type narrowing — `only` / `including` / `required` are constrained at compile time to the columns of the model passed as the first argument; rejects unknown column names

## 3.2.1

- stop injecting `additionalProperties: false` into serializer openapi shapes
- update the router to
- generate routes without trailing slash
- ignore trailing slashes when doing route matching

## 3.2.0

- new `extractParams` and `extractImplicitParams` primitives on `PsychicController` for narrowing untrusted request params before model writes; `paramsFor` is deprecated in favor of these — `extractParams` requires an explicit allowlist at the call site, `extractImplicitParams` reads the model's declared `paramSafeColumns`. `psy g:resource` / `psy g:controller` scaffolds emit one of these by namespace (`extractImplicitParams` for admin-namespaced resources, `extractParams` with a commented-out list of every implicitly-allowed column elsewhere), overridable via `--with-extract-params` / `--with-extract-implicit-params`
- the param merge inside `extractParams` / `extractImplicitParams` builds its accumulator with `Object.create(null)` so user-supplied `__proto__` / `constructor` keys cannot poison the resulting object's prototype chain
- controller `redirect` helpers reject open-redirect targets — only same-origin URLs and explicitly-listed allowed hosts pass; cross-origin attempts throw instead of silently sending a `Location` header to an attacker-controlled URL
- session cookies default to `SameSite=Strict` (was `Lax`); opt back in to `Lax` if your app relies on cross-site link-back flows
- default response headers include `Cross-Origin-Resource-Policy: same-origin`, blocking opaque cross-origin embedding of API responses by default
- `@koa/cors` is no longer mounted when no `cors` options are configured, so a default Psychic app does not advertise permissive CORS unless the developer opts in
- apps with an invalid cookie-encryption key now fail closed at boot in production (previously they booted and failed at runtime the first time a cookie was encrypted, leaving users with mysterious session errors); non-production environments still warn loudly without throwing so onboarding flows are not interrupted
- `path-to-regexp` is pinned to `>=8.4.0` via `pnpm.overrides` to pull in the patched router-DoS fix
- Postgres TLS configuration uses `ssl:` (the deprecated `useSsl:` option has been migrated off internally and should be replaced in app code)
- `delegatedAttribute` covers `optional` / `required` consistently across all OpenAPI inference branches
- OpenAPI diff tooling recognizes oasdiff 1.15's "No breaking changes to report" output
- `launchDevServer` and `OpenApiSpecDiff.compare` throw `LaunchDevServerRequiresDevelopmentOrTest` / `OpenApiSpecDiffRequiresDevelopmentOrTest` when `NODE_ENV` is anything other than `development` or `test`, turning their dev-only contracts into runtime invariants that fail closed for staging-style and unforeseen environments
- `PackageManager.add` / `.run` / `.exec` and `psyCmd` now return `{ command, args }` argv tuples (instead of full shell-form strings) so callers can invoke `DreamCLI.spawn(command, { args })` without shell parsing; generated `cli:sync` initializers and direct callers (Watcher, post-sync, openapi binding generators) updated to use the argv form

## 3.1.3

- gate auto-generated type/schema/OpenAPI sync to `NODE_ENV=test`; `psy sync` and `psy post-sync` no longer regenerate files in development, preventing a stale dev database from clobbering types generated under tests
- fix cli `--only` documentation ('destroy', not 'delete') for resource generator
- resource generator supports `--no-soft-delete` flag

## 3.1.2

- fix ability to specify `$serializableSerializerKey` when specifying `$serializable` in nested custom response shape for a controller action

## 3.1.1

- fix the `setup:sync:openapi-zustand` CLI command so it generates Zustand stores, not just API shapes

## 3.1.0

- fix initializers created by sync setup scripts so they don't use npx
- `optional` option on DreamSerializer `delegatedAttribute` customizes OpenAPI shape of automatically inferred fields to allow `null` (when the model being delegated to may be null, automatically inferred for optional belongs-to associations, but not inferrable for has-one associations)

## 3.0.5

- update @hey-api/openapi-ts

## 3.0.4

- improve dev server startup
- improve CLI documentation
- add `--table-name` option to resource generator

## 3.0.3

- CLI fixes (incorrect description, missing defaults, broken flag)
- Bump vulnerable packages to latest versions
- Don't revert the sync'd changes to types files if post-sync operations fail. This prevents small issues like missing routes for new OpenAPI endpoints from needlessly causing your types files to revert, creating needless confusion in your codebase.

## 3.0.2

- `inspect:controller-hierarchy` CLI command to display the complete controller tree based on inheritance, not directory structure
- `check:controller-hierarchy` CLI command to error if there is a controller hierarchy violation (for CI checks)

## 3.0.1

add case-insensitive header method to PsychicController

## 3.0.0

Replaces Express with [Koa](https://koajs.com/) as the underlying HTTP framework. This is a breaking change that affects middleware, error handling, and several dependencies. For the most part, there are no breaking changes, save small ways in which the error handling mechanisms are defined, in addition to custom middleware that you may have been utilizing. Follow this guide to help bring your app up to date.

- Compiled JSON schema can be automatilly generated from the OpenAPI shape for 2x-5x faster serialization (add `fastJsonStringify: true` to the @OpenAPI decorator options for a controller action)
- Removes the `sanitizeResponseJson` since it is truly unnecessary (see CHANGELOG note for 1.7.0 for why it was introduced)
- Adds the `--model-name` option to the resource generator

### Dependencies

#### Remove

Remove from `dependencies`:

```
express
cors
body-parser (if used separately)
```

Remove from `devDependencies`:

```
@types/express
@types/cors
```

#### Add

Add to `dependencies`:

```
koa
@koa/cors
koa-bodyparser
```

Add to `devDependencies`:

```
@types/koa
@types/koa__cors
@types/koa__router
@types/koa-bodyparser
```

> **Note:** `@koa/router` is a dependency of `@rvoh/psychic` itself -- you do not need to install it directly unless you use it outside of Psychic's router.

If you use Passport.js for authentication, also swap `passport` usage for `koa-passport` and add `koa-session`.

Add to `dependencies`:

```
koa-passport
koa-session
```

Add to `devDependencies`:

```
@types/koa-passport
```

### Middleware

`psy.use()` now expects Koa middleware `(ctx, next)` instead of Express middleware `(req, res, next)`.

Before (Express):

```typescript
psy.use(async (req, res, next) => {
  res.setHeader('X-Custom', 'value')
  next()
})
```

After (Koa):

```typescript
psy.use(async (ctx, next) => {
  ctx.set('X-Custom', 'value')
  await next()
})
```

> **Important:** Always `await next()` in Koa middleware. Forgetting to `await` can cause subtle ordering bugs.

### Route-level middleware

For standard routing, there are no breaking changes. However, for custom route handlers registered directly in your routes file that tapped into express middleware previously must also use Koa conventions. `ctx.body` replaces `res.json()` / `res.send()`.

Before (Express):

```typescript
r.get('health', (req, res) => {
  res.json({ status: 'ok' })
})
```

After (Koa):

```typescript
r.get('health', async ctx => {
  ctx.body = { status: 'ok' }
})
```

If the consumer expects a JSON content type (e.g. supertest's `res.body` parsing), set `ctx.type` explicitly:

```typescript
r.get('health', async ctx => {
  ctx.type = 'json'
  ctx.body = JSON.stringify({ status: 'ok' })
})
```

### `server:error` handler

The `server:error` callback now receives a Koa `ctx` instead of Express `req`/`res`. Use `ctx.headerSent`, `ctx.status`, and `ctx.body`:

```typescript
psy.on('server:error', (err, ctx) => {
  console.error(err)
  if (!ctx.headerSent) {
    ctx.status = 500
    ctx.body = ''
  }
})
```

### `PsychicServer`

- `server.expressApp` is now `server.koaApp` (a `Koa` instance).

### Testing with `@rvoh/psychic-spec-helpers`

Update `@rvoh/psychic-spec-helpers` to `>=3.0.0`, which uses Koa internally. The `specRequest` API is unchanged -- `init`, `get`, `post`, `put`, `patch`, `delete`, and `session` all work the same way.

### Passport.js

Replace `passport` with `koa-passport` and set up `koa-session` in a `server:init:before-middleware` hook (the server is not available during `PsychicApp.init`):

```typescript
import koaSession from 'koa-session'
import passport from 'koa-passport'

psy.on('server:init:before-middleware', server => {
  server.koaApp.keys = ['your-session-secret']
  server.koaApp.use(koaSession({}, server.koaApp))
  server.koaApp.use(passport.initialize())
  server.koaApp.use(passport.session())
})
```

Additionally, when using Passport, in route handlers and controllers, the authenticated user is on `ctx.state.user` instead of `req.user`:

```typescript
// Before (Express)
const user = this.req.user

// After (Koa)
const user = this.ctx.state.user
```

### Controller changes

- `this.req` and `this.res` no longer exist. Use `this.ctx` (a `Koa.Context`) instead.
- HTTP headers are now lowercased: Koa automatically lowercases all HTTP header names. When accessing request headers via `ctx.get()` or `ctx.request.header`, use lowercase header names (e.g., `ctx.get('content-type')` instead of `ctx.get('Content-Type')`). Response headers set via `ctx.set()` will also be lowercased.

### CORS

CORS options are now passed to `@koa/cors` instead of the `cors` Express package. The option shapes are similar but check the [`@koa/cors` docs](https://github.com/koajs/cors) for any differences. Notably, `@koa/cors` accepts functions for `origin` that receive the Koa `ctx` as the argument rather than Express `req`.

## 2.3.9

- `castParam` and `paramsFor` support `time` and `timetz`

## 2.3.8

- add new config option `httpServerOptions`, which enables devs to configure the options provided to the low-level http/https instance that is created and fed to express.

## 2.3.7

- patch issue causing unexpected HTTP methods to fail to resolve during psy sync when they point specifically to the `update` method on a controller.

## 2.3.6

- fix `psy diff:openapi` to exit after completion

## 2.3.5

- patch `psy diff:openapi` to consider filepaths where project root is different from the git root

## 2.3.4

- make ca and rejectUnauthorized args ssl options optional

## 2.3.3

- add missing ca and rejectUnauthorized args to ssl options

## 2.3.2

- fix `castParam` for any valid UUID

## 2.3.1

- move packageManager check to dream application

## 2.3.0

- deprecate `scrollPaginate` options in favor of `cursorPaginate`
- resource controller index actions are generated with the `cursorPaginate` pagination
- resource controller index actions are no longer generated generated with a default ordering since `cursorPaginate` includes a default pagination and UUIDv7 is now supported

## 2.2.1

- resource spec factory for uuid columns should `import { randomUUID } from 'node:crypto'` and compare against UUIDs like datetime and date columns are compared against DateTime and CalendarDate

## 2.2.0

- `psy diff:openapi` with optional `--fail-on-breaking` flag for CI checks to prevent introducing breaking OpenAPI spec changes
- OpenAPI config in `conf/app` now supports `checkDiffs` boolean to specify an OpenAPI spec for breaking change detection
- model and resource generators support alternate casings of `belongs_to` (e.g. `BelongsTo`, `belongsTo`)

## 2.1.0

- add custom AST type builder to create custom types file
- deprecate ability to add custom types to the psychic types file

## 2.0.4

improve CLI command descriptions

## 2.0.3

don't require database to exist when generating code

## 2.0.2

bump glob to close dependabot alerts

## 2.0.1

- stop exporting `pluralize` since it's just a direct export of `pluralize-esm`

## 2.0.0

- namespace package exports
- remove `including` support from `paramsFor`

## 1.14.0

- generated code uses absolute imports
- account for change in Dream in which `Virtual` decorator requires OpenAPI shape
- throw a more detailed error when DreamSerializer.attribute used to render a non-database, non-Virtual decorated property
- fix OpenAPI generated when paginating/scrollPaginating an STI base model
- add `--ignore-errors` option to `pnpm psy sync` so can build complicated OpenAPI shapes and serializers without needing to follow a set order

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
