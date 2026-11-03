import isObject from '../../helpers/isObject.js'
import { createValidator, ValidateOpenapiSchemaOptions } from '../../helpers/validateOpenApiSchema.js'

/**
 * @internal
 *
 * Returns true when request validation rejects an empty object (`{}`)
 * against `schema`.
 *
 * Psychic reads a request sent without a body as `{}`, so a request body
 * whose schema rejects `{}` cannot be left out, and the rendered OpenAPI
 * marks that body `required: true`.
 *
 * This does not model the schema's keywords. It asks the validator request
 * validation uses: the schema, with the document's `components`, is compiled
 * by `createValidator` under `ajvOptions` and run on `{}`. So `required`,
 * `minProperties`, `type`, defaults request validation fills in, `$ref`,
 * `allOf`, `oneOf` and `anyOf` all answer exactly as they do for a request.
 *
 * A schema that does not compile under `ajvOptions`, such as one whose
 * `$ref` does not resolve, counts as accepting `{}`: request validation
 * cannot reject a request with it, and rendering the document must not fail
 * on it.
 *
 * @param schema - the request body schema, as rendered into the OpenAPI document
 * @param components - the document's `components`, which the schema's `$ref`s resolve against
 * @param ajvOptions - the options request validation compiles this body's schema with
 */
export default function schemaRejectsEmptyObject(
  schema: unknown,
  components: object,
  ajvOptions: ValidateOpenapiSchemaOptions,
): boolean {
  if (!isObject(schema)) return false

  let validate: ReturnType<typeof createValidator>
  try {
    validate = createValidator({ ...(schema as object), components }, ajvOptions)
  } catch {
    return false
  }

  return !validate({})
}
