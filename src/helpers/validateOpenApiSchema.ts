import { Ajv, type ErrorObject, type JSONSchemaType, type ValidateFunction } from 'ajv'
import addFormats from 'ajv-formats'

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
    useDefaults: true,
    coerceTypes: true,
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
 * @param schema - JSON Schema to validate against
 * @param options - Validation options
 * @returns A validator function that can be reused for multiple validations
 */
export function createValidator<T = unknown>(
  schema: JSONSchemaType<T> | object,
  options: ValidateOpenapiSchemaOptions = {},
): ValidateFunction<T> {
  const ajvOptions = {
    ...options,
    init: undefined,
  }

  const ajv = new Ajv({
    removeAdditional: false,
    useDefaults: true,
    coerceTypes: true,
    strict: false, // Allow unknown keywords for OpenAPI compatibility
    allErrors: options.allErrors || false, // Collect all errors, not just the first one
    validateFormats: true, // Enable format validation for date-time, email, etc.
    ...ajvOptions,
  })

  // unfortunately, the Node16 resolution does not play
  // nicely with the addFormats function, since it is
  // stuck in commonjs. Typescript cannot resolve types
  // correctly, but after building and being consumed
  // on the other side of a build, this is the only
  // way to actually call the addFormats function without
  // it breaking.
  ;(addFormats as unknown as (ajv: unknown) => void)(ajv)

  ajv.addFormat('decimal', {
    type: 'string',
    validate: data => DECIMAL_REGEX.test(data),
  })

  ajv.addFormat('bigint', {
    type: 'string',
    validate: data => BIGINT_REGEX.test(data),
  })

  options?.init?.(ajv)

  return ajv.compile(schema) as ValidateFunction<T>
}

const DECIMAL_REGEX = /^-?(\d+\.?\d*|\.\d+)$/
const BIGINT_REGEX = /^-?\d+(\.0*)?$/

/**
 * Formats AJV errors into a more readable format
 */
function formatAjvErrors(ajvErrors: ErrorObject[]): ValidationError[] {
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

export type AjvValidationOpts = ConstructorParameters<typeof Ajv>[0]
export type ValidateOpenapiSchemaOptions = AjvValidationOpts & CustomOpenapiValidationOptions

export interface CustomOpenapiValidationOptions {
  init?: (ajv: Ajv) => void
}
