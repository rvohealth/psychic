import AjvModule, { type JSONSchemaType, type ValidateFunction, type ErrorObject } from 'ajv'
import addFormatsModule from 'ajv-formats'

const Ajv = AjvModule.default || AjvModule
const addFormats = addFormatsModule.default || addFormatsModule

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

export interface ValidationOptions {
  /**
   * Remove additional properties not defined in schema (default: false)
   */
  removeAdditional?: boolean | 'all' | 'failing'

  /**
   * Use default values from schema (default: true)
   */
  useDefaults?: boolean

  /**
   * Coerce types (default: true)
   */
  coerceTypes?: boolean

  /**
   * Allow unknown formats (default: true)
   */
  allowUnknownFormats?: boolean
}

/**
 * Creates an AJV validator function for validating objects against JSON schemas
 *
 * @param schema - JSON Schema to validate against
 * @param options - Validation options
 * @returns A validator function that can be reused for multiple validations
 */
export function createValidator<T = unknown>(
  schema: JSONSchemaType<T> | object,
  options: ValidationOptions = {},
): ValidateFunction<T> {
  const {
    removeAdditional = false,
    useDefaults = true,
    coerceTypes = true,
    // allowUnknownFormats = true,
  } = options

  const ajv = new Ajv({
    removeAdditional,
    useDefaults,
    coerceTypes,
    strict: false, // Allow unknown keywords for OpenAPI compatibility
    allErrors: true, // Collect all errors, not just the first one
    validateFormats: false, // Enable format validation unless explicitly disabled
  })

  // Add common formats (date, time, email, etc.) for OpenAPI compatibility
  addFormats(ajv)

  return ajv.compile(schema) as ValidateFunction<T>
}

/**
 * Validates an object against a JSON schema using AJV
 *
 * @param data - Object to validate
 * @param schema - JSON Schema to validate against
 * @param options - Validation options
 * @returns ValidationResult with success status, validated data, and any errors
 *
 * @example
 * ```typescript
 * const schema = {
 *   type: 'object',
 *   properties: {
 *     name: { type: 'string' },
 *     age: { type: 'integer', minimum: 0 }
 *   },
 *   required: ['name']
 * }
 *
 * const result = validateObject({ name: 'John', age: 30 }, schema)
 * if (result.isValid) {
 *   console.log('Valid data:', result.data)
 * } else {
 *   console.log('Validation errors:', result.errors)
 * }
 * ```
 */
export function validateObject<T = unknown>(
  data: unknown,
  schema: JSONSchemaType<T> | object,
  options: ValidationOptions = {},
): ValidationResult<T> {
  try {
    const validate = createValidator<T>(schema, options)
    const isValid = validate(data)

    if (isValid) {
      return {
        isValid: true,
        data: data,
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
 * Validates an object against an OpenAPI schema
 * Convenience wrapper around validateObject with OpenAPI-friendly defaults
 *
 * @param data - Object to validate
 * @param openapiSchema - OpenAPI schema object
 * @returns ValidationResult
 */
export function validateOpenApiSchema<T = unknown>(
  data: unknown,
  openapiSchema: object,
): ValidationResult<T> {
  return validateObject<T>(data, openapiSchema, {
    removeAdditional: 'failing', // Remove properties that fail validation
    useDefaults: true,
    coerceTypes: true,
    allowUnknownFormats: true,
  })
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

export default validateObject
