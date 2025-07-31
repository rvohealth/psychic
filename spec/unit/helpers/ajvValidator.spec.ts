import {
  createValidator,
  validateObject,
  validateOpenApiSchema,
  type ValidationOptions,
  type ValidationResult,
} from '../../../src/helpers/ajvValidator.js'

describe('ajvValidator', () => {
  describe('createValidator', () => {
    it('creates a validator function for a simple schema', () => {
      const schema = {
        type: 'object',
        properties: {
          name: { type: 'string' },
          age: { type: 'number' },
        },
        required: ['name'],
      }

      const validator = createValidator(schema)
      expect(typeof validator).toBe('function')
    })

    it('creates a validator that validates valid data', () => {
      const schema = {
        type: 'object',
        properties: {
          name: { type: 'string' },
          age: { type: 'number' },
        },
        required: ['name'],
      }

      const validator = createValidator(schema)
      const result = validator({ name: 'John', age: 30 })
      expect(result).toBe(true)
    })

    it('creates a validator that rejects invalid data', () => {
      const schema = {
        type: 'object',
        properties: {
          name: { type: 'string' },
          age: { type: 'number' },
        },
        required: ['name'],
      }

      const validator = createValidator(schema)
      const result = validator({ age: 30 }) // missing required name
      expect(result).toBe(false)
      expect(validator.errors).toBeDefined()
    })

    it('supports type coercion by default', () => {
      const schema = {
        type: 'object',
        properties: {
          age: { type: 'number' },
        },
      }

      const validator = createValidator(schema)
      const data = { age: '30' } // string that should be coerced to number
      const result = validator(data)
      expect(result).toBe(true)
      expect(data.age).toBe(30) // should be coerced to number
    })

    it('can disable type coercion', () => {
      const schema = {
        type: 'object',
        properties: {
          age: { type: 'number' },
        },
      }

      const validator = createValidator(schema, { coerceTypes: false })
      const result = validator({ age: '30' })
      expect(result).toBe(false)
    })

    it('applies default values by default', () => {
      const schema = {
        type: 'object',
        properties: {
          name: { type: 'string' },
          active: { type: 'boolean', default: true },
        },
      }

      const validator = createValidator(schema)
      const data = { name: 'John' }
      const result = validator(data)
      expect(result).toBe(true)
      expect(data.active).toBe(true)
    })

    it('can disable default values', () => {
      const schema = {
        type: 'object',
        properties: {
          name: { type: 'string' },
          active: { type: 'boolean', default: true },
        },
      }

      const validator = createValidator(schema, { useDefaults: false })
      const data = { name: 'John' }
      const result = validator(data)
      expect(result).toBe(true)
      expect(data.active).toBeUndefined()
    })

    it('supports removing additional properties', () => {
      const schema = {
        type: 'object',
        properties: {
          name: { type: 'string' },
        },
        additionalProperties: false,
      }

      const validator = createValidator(schema, { removeAdditional: true })
      const data = { name: 'John', extra: 'remove me' }
      const result = validator(data)
      expect(result).toBe(true)
      expect(data.extra).toBeUndefined()
    })

    it('supports date-time format validation', () => {
      const schema = {
        type: 'object',
        properties: {
          timestamp: { type: 'string', format: 'date-time' },
        },
      }

      const validator = createValidator(schema)
      expect(validator({ timestamp: '2023-01-01T10:00:00Z' })).toBe(true)
      expect(validator({ timestamp: 'invalid-date' })).toBe(false)
    })

    it('supports email format validation', () => {
      const schema = {
        type: 'object',
        properties: {
          email: { type: 'string', format: 'email' },
        },
      }

      const validator = createValidator(schema)
      expect(validator({ email: 'test@example.com' })).toBe(true)
      expect(validator({ email: 'invalid-email' })).toBe(false)
    })
  })

  describe('validateObject', () => {
    it('returns valid result for correct data', () => {
      const schema = {
        type: 'object',
        properties: {
          name: { type: 'string' },
          age: { type: 'number' },
        },
        required: ['name'],
      }

      const result = validateObject({ name: 'John', age: 30 }, schema)
      expect(result.isValid).toBe(true)
      expect(result.data).toEqual({ name: 'John', age: 30 })
      expect(result.errors).toBeUndefined()
    })

    it('returns invalid result with errors for incorrect data', () => {
      const schema = {
        type: 'object',
        properties: {
          name: { type: 'string' },
          age: { type: 'number' },
        },
        required: ['name'],
      }

      const result = validateObject({ age: 30 }, schema)
      expect(result.isValid).toBe(false)
      expect(result.data).toBeUndefined()
      expect(result.errors).toBeDefined()
      expect(result.errors).toHaveLength(1)
      expect(result.errors![0].keyword).toBe('required')
      expect(result.errors![0].message).toContain('name')
    })

    it('handles type validation errors', () => {
      const schema = {
        type: 'object',
        properties: {
          age: { type: 'number' },
        },
      }

      const result = validateObject({ age: 'not-a-number' }, schema, { coerceTypes: false })
      expect(result.isValid).toBe(false)
      expect(result.errors).toBeDefined()
      expect(result.errors![0].keyword).toBe('type')
    })

    it('handles minimum/maximum validation', () => {
      const schema = {
        type: 'object',
        properties: {
          age: { type: 'number', minimum: 0, maximum: 120 },
        },
      }

      expect(validateObject({ age: -5 }, schema).isValid).toBe(false)
      expect(validateObject({ age: 150 }, schema).isValid).toBe(false)
      expect(validateObject({ age: 25 }, schema).isValid).toBe(true)
    })

    it('handles string length validation', () => {
      const schema = {
        type: 'object',
        properties: {
          name: { type: 'string', minLength: 2, maxLength: 10 },
        },
      }

      expect(validateObject({ name: 'a' }, schema).isValid).toBe(false)
      expect(validateObject({ name: 'this-is-too-long' }, schema).isValid).toBe(false)
      expect(validateObject({ name: 'valid' }, schema).isValid).toBe(true)
    })

    it('handles array validation', () => {
      const schema = {
        type: 'object',
        properties: {
          tags: {
            type: 'array',
            items: { type: 'string' },
            minItems: 1,
            maxItems: 5,
          },
        },
      }

      expect(validateObject({ tags: [] }, schema).isValid).toBe(false)
      expect(validateObject({ tags: ['a', 'b', 'c', 'd', 'e', 'f'] }, schema).isValid).toBe(false)
      expect(validateObject({ tags: ['valid', 'array'] }, schema).isValid).toBe(true)
    })

    it('handles nested object validation', () => {
      const schema = {
        type: 'object',
        properties: {
          user: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              email: { type: 'string', format: 'email' },
            },
            required: ['name', 'email'],
          },
        },
      }

      const validData = {
        user: {
          name: 'John',
          email: 'john@example.com',
        },
      }

      const invalidData = {
        user: {
          name: 'John',
          // missing email
        },
      }

      expect(validateObject(validData, schema).isValid).toBe(true)
      expect(validateObject(invalidData, schema).isValid).toBe(false)
    })

    it('handles schema compilation errors gracefully', () => {
      const invalidSchema = {
        type: 'invalid-type', // this should cause a compilation error
      }

      const result = validateObject({ test: 'data' }, invalidSchema)
      expect(result.isValid).toBe(false)
      expect(result.errors).toBeDefined()
      expect(result.errors![0].keyword).toBe('schema')
    })

    it('applies coercion when enabled', () => {
      const schema = {
        type: 'object',
        properties: {
          age: { type: 'number' },
          active: { type: 'boolean' },
        },
      }

      const result = validateObject({ age: '30', active: 'true' }, schema, { coerceTypes: true })
      expect(result.isValid).toBe(true)
      expect(result.data).toEqual({ age: 30, active: true })
    })

    it('applies default values when enabled', () => {
      const schema = {
        type: 'object',
        properties: {
          name: { type: 'string' },
          active: { type: 'boolean', default: false },
        },
      }

      const result = validateObject({ name: 'John' }, schema, { useDefaults: true })
      expect(result.isValid).toBe(true)
      expect(result.data).toEqual({ name: 'John', active: false })
    })
  })

  describe('validateOpenApiSchema', () => {
    it('validates OpenAPI schemas with appropriate defaults', () => {
      const openapiSchema = {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string' },
          age: { type: 'integer', minimum: 0 },
          email: { type: 'string', format: 'email' },
        },
        required: ['id', 'name'],
      }

      const validData = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'John Doe',
        age: '30', // should be coerced to number
        email: 'john@example.com',
      }

      const result = validateOpenApiSchema(validData, openapiSchema)
      expect(result.isValid).toBe(true)
      expect(result.data.age).toBe(30) // coerced to number
    })

    it('removes failing additional properties in OpenAPI mode', () => {
      const openapiSchema = {
        type: 'object',
        properties: {
          name: { type: 'string' },
        },
        additionalProperties: false,
      }

      const dataWithExtra = {
        name: 'John',
        invalidExtra: 'should be removed',
      }

      const result = validateOpenApiSchema(dataWithExtra, openapiSchema)
      expect(result.isValid).toBe(true)
      expect(result.data.invalidExtra).toBeUndefined()
    })

    it('handles OpenAPI-specific formats', () => {
      const openapiSchema = {
        type: 'object',
        properties: {
          date: { type: 'string', format: 'date' },
          time: { type: 'string', format: 'time' },
          uri: { type: 'string', format: 'uri' },
        },
      }

      const validData = {
        date: '2023-01-01',
        time: '10:30:00',
        uri: 'https://example.com',
      }

      const result = validateOpenApiSchema(validData, openapiSchema)
      expect(result.isValid).toBe(true)
    })

    it('returns detailed error information for OpenAPI validation failures', () => {
      const openapiSchema = {
        type: 'object',
        properties: {
          email: { type: 'string', format: 'email' },
          age: { type: 'integer', minimum: 18 },
        },
        required: ['email', 'age'],
      }

      const invalidData = {
        email: 'invalid-email',
        age: 15,
      }

      const result = validateOpenApiSchema(invalidData, openapiSchema)
      expect(result.isValid).toBe(false)
      expect(result.errors).toBeDefined()
      expect(result.errors!.length).toBeGreaterThan(0)

      const emailError = result.errors!.find(err => err.instancePath === '/email')
      const ageError = result.errors!.find(err => err.instancePath === '/age')

      expect(emailError).toBeDefined()
      expect(ageError).toBeDefined()
    })
  })

  describe('error formatting', () => {
    it('formats errors with all required fields', () => {
      const schema = {
        type: 'object',
        properties: {
          name: { type: 'string' },
          age: { type: 'number', minimum: 0 },
        },
        required: ['name'],
      }

      const result = validateObject({ age: -5 }, schema)
      expect(result.isValid).toBe(false)
      expect(result.errors).toBeDefined()

      const errors = result.errors!
      expect(errors.length).toBeGreaterThan(0)

      errors.forEach(error => {
        expect(error).toHaveProperty('instancePath')
        expect(error).toHaveProperty('schemaPath')
        expect(error).toHaveProperty('keyword')
        expect(error).toHaveProperty('message')
        expect(typeof error.instancePath).toBe('string')
        expect(typeof error.schemaPath).toBe('string')
        expect(typeof error.keyword).toBe('string')
        expect(typeof error.message).toBe('string')
      })
    })

    it('includes params when available', () => {
      const schema = {
        type: 'object',
        properties: {
          age: { type: 'number', minimum: 18 },
        },
      }

      const result = validateObject({ age: 15 }, schema)
      expect(result.isValid).toBe(false)

      const minError = result.errors!.find(err => err.keyword === 'minimum')
      expect(minError).toBeDefined()
      expect(minError!.params).toBeDefined()
      expect(minError!.params!.limit).toBe(18)
    })
  })

  describe('edge cases', () => {
    it('handles null data', () => {
      const schema = { type: 'object' }
      const result = validateObject(null, schema)
      expect(result.isValid).toBe(false)
    })

    it('handles undefined data', () => {
      const schema = { type: 'object' }
      const result = validateObject(undefined, schema)
      expect(result.isValid).toBe(false)
    })

    it('handles empty objects', () => {
      const schema = { type: 'object' }
      const result = validateObject({}, schema)
      expect(result.isValid).toBe(true)
    })

    it('handles complex nested validation', () => {
      const schema = {
        type: 'object',
        properties: {
          users: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                contacts: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      type: { type: 'string', enum: ['email', 'phone'] },
                      value: { type: 'string' },
                    },
                    required: ['type', 'value'],
                  },
                },
              },
              required: ['name'],
            },
          },
        },
      }

      const validData = {
        users: [
          {
            name: 'John',
            contacts: [
              { type: 'email', value: 'john@example.com' },
              { type: 'phone', value: '+1234567890' },
            ],
          },
        ],
      }

      const invalidData = {
        users: [
          {
            name: 'John',
            contacts: [
              { type: 'invalid', value: 'test' }, // invalid enum value
            ],
          },
        ],
      }

      expect(validateObject(validData, schema).isValid).toBe(true)
      expect(validateObject(invalidData, schema).isValid).toBe(false)
    })
  })
})
