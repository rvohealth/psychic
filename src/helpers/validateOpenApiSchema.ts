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
  data: T,
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
export function validateObject<T>(
  data: T,
  schema: JSONSchemaType<T> | object,
  options: ValidateOpenapiSchemaOptions = {},
): ValidationResult<T> {
  try {
    const strictResults = runStrictValidations(data, schema, options)

    // if strictResults are isValid=false, then their type
    // is truly ValidationResult<T>, since it only returns
    // undefined when isValid=true.
    if (!strictResults.isValid) return strictResults as ValidationResult<T>

    return runNonStrictValidations(data, schema, options)
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
 * when using the ajv library, psychic takes a hybrid approach to type coercion.
 * we want to permit coercions like '123' -> 123 for an integer, but we do not want
 * null to be coerced to 0. Unfortunately, ajv does not provide the nuance in their
 * configuration options to achieve this type of result, so we have to validate twice,
 * once to exclusively detect invalid null coercions, and the other to detect anything else.
 *
 * This function is specifically designed to identify null coercions, and needs to be run
 * before the runNonStrictValidations so that null coercions can be handled specially. It is named
 * generically as 'runStrictValidations', since in the future we may want to do other special
 * validations, and they would also need to be done prior to calling runNonStrictValidations.
 *
 * @param data - the data to validate
 * @param schema - the openapi schema to validate against
 * @param options - ajv option overrides
 * @returns a validation result
 */
function runStrictValidations<T>(
  data: T,
  schema: JSONSchemaType<T> | object,
  options: ValidateOpenapiSchemaOptions = {},
): ValidationResult<undefined> {
  const validator = createValidator<T>(schema, {
    ...options,
    coerceTypes: false,
  })
  const cloned = structuredClone(data)
  const isValid = validator(cloned)

  if (!isValid) {
    const nullCoercionErrors = detectNullCoercionErrors(validator.errors || [], data)
    if (nullCoercionErrors.length > 0) {
      return {
        isValid: false,
        errors: formatAjvErrors(nullCoercionErrors),
      }
    }
  }

  return {
    isValid: true,
    errors: [],

    // explicitly return undefined for data,
    // since runStrictValidations should alway
    // be followed up by a call to runNonStrictValidations,
    // which will perform type coercion on the resulting
    // data, enabling psychic to take advantage of the coerced
    // values when i.e. calling `castParam`, which leverages
    // the coerced values for its return value. see the validateObject
    // function to understand how this is done.
    data: undefined,
  }
}

/**
 * @internal
 *
 * when using the ajv library, psychic takes a hybrid approach to type coercion.
 * we want to permit coercions like '123' -> 123 for an integer, but we do not want
 * null to be coerced to 0. Unfortunately, ajv does not provide the nuance in their
 * configuration options to achieve this type of result, so we have to validate twice,
 * once to exclusively detect invalid null coercions, and the other to detect anything else.
 *
 * This function is specifically designed to coerce types using ajv, which will perform
 * the unwanted coercions like null -> 0. To escape this problem, this function must be
 * called after the runStrictValidations function, since that one is explicitly designed
 * to bypass ajv type coercion and capture null coercion errors specially.
 *
 * @param data - the data to validate
 * @param schema - the openapi schema to validate against
 * @param options - ajv option overrides
 * @returns a validation result
 */
function runNonStrictValidations<T>(
  data: T,
  schema: JSONSchemaType<T> | object,
  options: ValidateOpenapiSchemaOptions = {},
): ValidationResult<T> {
  const validator = createValidator<T>(schema, options)
  const cloned = structuredClone(data)
  const isValid = validator(cloned)

  if (isValid) {
    return {
      isValid: true,
      data: cloned,
    }
  } else {
    return {
      isValid: false,
      errors: formatAjvErrors(validator.errors || []),
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
    allErrors: false, // Collect all errors, not just the first one
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
 * @internal
 *
 * NOTE: written by AI
 *
 * This function checks if null values in the data would be coerced to other types
 * and returns errors specifically for those cases. ajv makes it difficult to
 * detect when the error we are running into was explicitly about a null coercion
 * error, so we have to infer it by scanning the shape of the errors object
 * returned
 */
function detectNullCoercionErrors(errors: ErrorObject[], data: unknown): ErrorObject[] {
  const nullCoercionErrors: ErrorObject[] = []

  for (const error of errors) {
    // Check if this error is a type mismatch where the actual value is null
    if (error.keyword === 'type' && error.instancePath) {
      const actualValue = getValueAtPath(data, error.instancePath)

      // If the actual value is null and the expected type is not null/undefined,
      // this would be a null coercion case
      if (actualValue === null && error.params?.type && error.params.type !== 'null') {
        nullCoercionErrors.push(error)
      }
    }

    // Also check for root level null values when the schema expects a specific type
    if (error.keyword === 'type' && error.instancePath === '' && data === null) {
      if (error.params?.type && error.params.type !== 'null') {
        nullCoercionErrors.push(error)
      }
    }
  }

  return nullCoercionErrors
}

/**
 * @internal
 *
 * NOTE: written by AI
 *
 * Helper function to get a value at a specific JSON path. used exclusively
 * by the detectNullCoercionErrors function to find the value at a particular
 * openapi path based on schema.
 */
function getValueAtPath(obj: unknown, path: string): unknown {
  if (!path || path === '') return obj

  // Remove leading slash and split by slash
  const parts = path.replace(/^\//, '').split('/')
  let current = obj

  for (const part of parts) {
    if (current == null || typeof current !== 'object') {
      return undefined
    }

    // Handle array indices
    if (Array.isArray(current) && /^\d+$/.test(part)) {
      current = current[parseInt(part, 10)]
    } else if (typeof current === 'object') {
      current = (current as Record<string, unknown>)[part]
    } else {
      return undefined
    }
  }

  return current
}

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
