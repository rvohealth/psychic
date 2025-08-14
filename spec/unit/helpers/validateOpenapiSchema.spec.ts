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
      age: '30', // use string to verify implicit coercion
      email: 'john@example.com',
    }

    const result = validateOpenApiSchema<typeof validData>(validData, openapiSchema)
    expect(result.isValid).toBe(true)
    expect(result.data!.age).toBe(30)

    // ensure that original data is not mutated
    expect(validData.age).toBe('30')
  })

  context('data types', () => {
    context('integer', () => {
      it('accepts string number for integer', () => {
        const result = validateOpenApiSchema(
          { age: '123' },
          {
            type: 'object',
            properties: {
              age: { type: 'integer' },
            },
            required: ['age'],
          },
        )
        expect(result.isValid).toBe(true)
      })

      it('rejects string non-integer for integer', () => {
        const result = validateOpenApiSchema(
          { age: '123.01' },
          {
            type: 'object',
            properties: {
              age: { type: 'integer' },
            },
            required: ['age'],
          },
        )
        expect(result.isValid).toBe(false)
      })

      it('rejects null for integer', () => {
        const result = validateOpenApiSchema(
          { age: null },
          {
            type: 'object',
            properties: {
              age: { type: 'integer' },
            },
            required: ['age'],
          },
        )
        expect(result.isValid).toBe(false)
      })
    })

    context('number', () => {
      it('accepts string number for integer', () => {
        const result = validateOpenApiSchema(
          { age: '123' },
          {
            type: 'object',
            properties: {
              age: { type: 'number' },
            },
            required: ['age'],
          },
        )
        expect(result.isValid).toBe(true)
      })

      it('rejects string non-number for number', () => {
        const result = validateOpenApiSchema(
          { age: 'abc123' },
          {
            type: 'object',
            properties: {
              age: { type: 'integer' },
            },
            required: ['age'],
          },
        )
        expect(result.isValid).toBe(false)
      })

      it('rejects null for number', () => {
        const result = validateOpenApiSchema(
          { age: null },
          {
            type: 'object',
            properties: {
              age: { type: 'integer' },
            },
            required: ['age'],
          },
        )
        expect(result.isValid).toBe(false)
      })
    })

    context('string', () => {
      it('accepts string for string types', () => {
        const result = validateOpenApiSchema(
          { name: 'chalupa joe' },
          {
            type: 'object',
            properties: {
              name: { type: 'string' },
            },
            required: ['name'],
          },
        )
        expect(result.isValid).toBe(true)
      })

      it('rejects null for string types', () => {
        const result = validateOpenApiSchema(
          { name: null },
          {
            type: 'object',
            properties: {
              name: { type: 'string' },
            },
            required: ['name'],
          },
        )
        expect(result.isValid).toBe(false)

        const nullError = result.errors!.find(err => err.instancePath === '/name')!
        expect(nullError.keyword).toBe('type')
      })
    })

    context('boolean', () => {
      it('accepts boolean for boolean types', () => {
        const result = validateOpenApiSchema(
          { tired: true },
          {
            type: 'object',
            properties: {
              tired: { type: 'boolean' },
            },
            required: ['tired'],
          },
        )
        expect(result.isValid).toBe(true)
      })

      it('rejects null for boolean types', () => {
        const result = validateOpenApiSchema(
          { tired: null },
          {
            type: 'object',
            properties: {
              tired: { type: 'boolean' },
            },
            required: ['tired'],
          },
        )
        expect(result.isValid).toBe(false)

        const nullError = result.errors!.find(err => err.instancePath === '/tired')!
        expect(nullError.keyword).toBe('type')
      })
    })

    context('object', () => {
      it('accepts object for object types', () => {
        const result = validateOpenApiSchema(
          { tired: true },
          {
            type: 'object',
            properties: {
              tired: { type: 'boolean' },
            },
            required: ['tired'],
          },
        )
        expect(result.isValid).toBe(true)
      })

      it('rejects null for object types', () => {
        const result = validateOpenApiSchema(null, {
          type: 'object',
          properties: {
            tired: { type: 'boolean' },
          },
          required: ['tired'],
        })
        expect(result.isValid).toBe(false)

        const nullError = result.errors!.find(err => err.instancePath === '')!
        expect(nullError.keyword).toBe('type')
      })
    })

    context('array', () => {
      it('accepts array for array types', () => {
        const result = validateOpenApiSchema(['howyadoin'], {
          type: 'array',
          items: {
            type: 'string',
          },
        })
        expect(result.isValid).toBe(true)
      })

      it('rejects null for object types', () => {
        const result = validateOpenApiSchema(null, {
          type: 'array',
          items: {
            type: 'string',
          },
        })
        expect(result.isValid).toBe(false)

        const nullError = result.errors!.find(err => err.instancePath === '')!
        expect(nullError.keyword).toBe('type')
      })

      it('rejects null for array items', () => {
        const result = validateOpenApiSchema([null, 'hello world'], {
          type: 'array',
          items: {
            type: 'string',
          },
        })
        expect(result.isValid).toBe(false)

        const nullError = result.errors!.find(err => err.instancePath === '/0')!
        expect(nullError.keyword).toBe('type')
      })
    })
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

  it('handles OpenAPI-specific formats', () => {
    const openapiSchema = {
      type: 'object',
      properties: {
        date: { type: 'string', format: 'date' },
        datetime: { type: 'string', format: 'date-time' },
        uri: { type: 'string', format: 'uri' },
        oneOfTest: {
          oneOf: [
            { type: 'string', format: 'uri' },
            { type: 'number', format: 'date-time' },
          ],
        },
        anyOfTest: {
          anyOf: [
            { type: 'string', format: 'uri' },
            { type: 'string', format: 'date-time' },
          ],
        },
      },
    }

    const validData = {
      date: '2023-01-01',
      datetime: '2023-01-01T10:00:00Z',
      uri: 'https://example.com',
      oneOfTest: 'https://example.com',
      anyOfTest: '2023-01-01T10:00:00Z',
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
