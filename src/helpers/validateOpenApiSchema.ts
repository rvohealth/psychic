import { DreamApp } from '@rvoh/dream'
import { type ErrorObject, type JSONSchemaType, type ValidateFunction } from 'ajv'

/**
 * @internal
 *
 * Validates an object against an OpenAPI schema
 * Convenience wrapper around validateObject with OpenAPI-friendly defaults.
 *
 * This function is used internally by the OpenapiPayloadValidator
 * class to correctly validate request body, query, headers,
 * and response body.
 *
 * @param data - Object to validate
 * @param openapiSchema - OpenAPI schema object
 * @param options - (Optional) options to provide when initializing the ajv instance
 * @returns ValidationResult
 *
 * @example
 *
 * ```ts
 * const schema = {
 *   type: 'object',
 *   properties: {
 *     name: { type: 'string' },
 *     age: { type: 'integer', minimum: 0 }
 *   },
 *   required: ['name']
 * }
 *
 * const result = validateOpenApiSchema({ name: 'John', age: 30 }, schema)
 * if (result.isValid) {
 *   console.log('Valid data:', result.data)
 * } else {
 *   console.log('Validation errors:', result.errors)
 * }
 * ```
 */
export default function validateOpenApiSchema<T = unknown>(
  data: unknown,
  openapiSchema: object,
  options: ValidateOpenapiSchemaOptions = {},
): ValidationResult<T> {
  return validateObject<T>(data, openapiSchema, {
    removeAdditional: 'failing', // Remove properties that fail validation
    ...options,
  })
}

/**
 * @internal
 *
 * Validates an object against a JSON schema using AJV
 *
 * @param data - Object to validate
 * @param schema - JSON Schema to validate against
 * @param options - Validation options
 * @returns ValidationResult with success status, validated data, and any errors
 */
export function validateObject<T = unknown>(
  data: unknown,
  schema: JSONSchemaType<T> | object,
  options: ValidateOpenapiSchemaOptions = {},
): ValidationResult<T> {
  try {
    const validate = createValidator<T>(schema, options)
    // Clone the data to prevent AJV from mutating the original object
    const clonedData = structuredClone(data)
    const isValid = validate(clonedData)

    if (isValid) {
      return {
        isValid: true,
        data: clonedData,
      }
    } else {
      return {
        isValid: false,
        errors: formatAjvErrors(validate.errors || []),
      }
    }
  } catch (error) {
    // Handle schema compilation errors
    return {
      isValid: false,
      errors: [
        {
          instancePath: '',
          schemaPath: '',
          keyword: 'schema',
          message: error instanceof Error ? error.message : 'Schema compilation failed',
        },
      ],
    }
  }
}

/**
 * @internal
 *
 * Creates an AJV validator function for validating objects against JSON schemas
 *
 * The AJV instance is Dream's (`DreamApp.system.createOpenapiAjv`), the one
 * Dream checks a model's declared shapes with, so the formats a schema names
 * (`ajv-formats`, `decimal`, `bigint`) and the defaults (no coercion, defaults
 * applied, `strict: false` with `strictTypes: true`, …) are defined once.
 * `options` override those defaults, and `options.init` receives the instance
 * before the schema is compiled, to add a custom format, say.
 *
 * @param schema - JSON Schema to validate against
 * @param options - Validation options
 * @returns A validator function that can be reused for multiple validations
 */
export function createValidator<T = unknown>(
  schema: JSONSchemaType<T> | object,
  options: ValidateOpenapiSchemaOptions = {},
): ValidateFunction<T> {
  const { init, ...ajvOptions } = options
  const ajv = DreamApp.system.createOpenapiAjv(ajvOptions)

  init?.(ajv)

  return ajv.compile(schema) as ValidateFunction<T>
}

/**
 * Formats AJV errors into a more readable format
 */
export function formatAjvErrors(ajvErrors: ErrorObject[]): ValidationError[] {
  return ajvErrors.map(error => ({
    instancePath: error.instancePath,
    schemaPath: error.schemaPath,
    keyword: error.keyword,
    message: error.message || 'Validation failed',
    params: error.params,
  }))
}

export interface ValidationResult<T = unknown> {
  isValid: boolean
  data?: T
  errors?: ValidationError[]
}

export interface ValidationError {
  instancePath: string
  schemaPath: string
  keyword: string
  message: string
  params?: Record<string, unknown>
}

// the options and the instance of Dream's AJV, so a custom format added in
// `init` lands on the instance Psychic compiles with
export type AjvValidationOpts = NonNullable<Parameters<typeof DreamApp.system.createOpenapiAjv>[0]>
export type ValidateOpenapiSchemaOptions = AjvValidationOpts & CustomOpenapiValidationOptions

export interface CustomOpenapiValidationOptions {
  init?: (ajv: ReturnType<typeof DreamApp.system.createOpenapiAjv>) => void
}
