import validateOpenApiSchema from '../../../src/helpers/validateOpenApiSchema.js'

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
      age: 30,
      email: 'john@example.com',
    }

    const result = validateOpenApiSchema<typeof validData>(validData, openapiSchema)
    expect(result.isValid).toBe(true)
    expect(result.data!.age).toBe(30)
  })

  it('removes failing additional properties in OpenAPI mode without mutating original', () => {
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

    const result = validateOpenApiSchema<typeof dataWithExtra>(dataWithExtra, openapiSchema)
    expect(result.isValid).toBe(true)
    expect(result.data!.invalidExtra).toBeUndefined()
    // Original data should not be mutated
    expect(dataWithExtra.invalidExtra).toBe('should be removed')
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

    const result = validateOpenApiSchema(invalidData, openapiSchema, { allErrors: true })
    expect(result.isValid).toBe(false)
    expect(result.errors).toBeDefined()
    expect(result.errors!.length).toBeGreaterThan(0)

    const emailError = result.errors!.find(err => err.instancePath === '/email')
    const ageError = result.errors!.find(err => err.instancePath === '/age')

    expect(emailError).toBeDefined()
    expect(ageError).toBeDefined()
  })

  context('when provided a custom formats via a callback', () => {
    it('applies the custom formats', () => {
      const openapiSchema = {
        type: 'object',
        required: ['myField'],
        properties: {
          myField: {
            type: 'string',
            format: 'howyadoin',
          },
        },
      }

      const validResult = validateOpenApiSchema({ myField: 'howyadoin' }, openapiSchema, {
        init: ajv => {
          ajv.addFormat('howyadoin', {
            type: 'string',
            validate: data => data === 'howyadoin',
          })
        },
      })
      expect(validResult.isValid).toBe(true)

      const invalidResult = validateOpenApiSchema({ myField: 'not-howyadoin' }, openapiSchema, {
        init: ajv => {
          ajv.addFormat('howyadoin', {
            type: 'string',
            validate: data => data === 'howyadoin',
          })
        },
      })
      expect(invalidResult.isValid).toBe(false)
    })
  })
})
