import { CalendarDate, ObjectSerializer } from '@rvoh/dream'
import { OpenapiSchemaBodyShorthand } from '@rvoh/dream/openapi'
import { validateObject } from '../../../../../src/helpers/validateOpenApiSchema.js'
import SerializerOpenapiRenderer from '../../../../../src/openapi-renderer/SerializerOpenapiRenderer.js'

// validates a value against a rendered property schema with the Ajv options Psychic validates with
function validates(schema: unknown, value: unknown) {
  return validateObject(value, schema as object).isValid
}

// renders the schema of a `user.name` delegatedAttribute marked optional
function optionalNameSchema(openapi: OpenapiSchemaBodyShorthand) {
  const MySerializer = (data: Pet) =>
    ObjectSerializer(data).delegatedAttribute('user', 'name', { openapi, optional: true })

  return new SerializerOpenapiRenderer(MySerializer)['renderedOpenapiAttributes']().attributes.name
}

interface Address {
  city?: string
}

interface User {
  name?: string
  birthdate?: CalendarDate
  address?: Address
}

interface Pet {
  name?: string
  user?: User
  defaultUser?: User
}

describe('ObjectSerializer delegated attributes', () => {
  it('delegates value and type to the specified target', () => {
    const MySerializer = (data: Pet) =>
      ObjectSerializer(data)
        .delegatedAttribute('user', 'name', { openapi: 'string' })
        .delegatedAttribute('user', 'birthdate', { openapi: 'date' })

    const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer)
    expect(serializerOpenapiRenderer['renderedOpenapiAttributes']().attributes).toEqual({
      name: {
        type: 'string',
      },
      birthdate: {
        type: 'string',
        format: 'date',
      },
    })
  })

  context('with `required: false`', () => {
    it('omits the property from the required fields in the rendered OpenAPI', () => {
      const MySerializer = (data: Pet) =>
        ObjectSerializer(data).delegatedAttribute('user', 'name', { openapi: 'string', required: false })

      const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
      expect((serializerOpenapiRenderer.renderedOpenapi().openapi as any).required).toEqual([])
    })
  })

  context('when repeating the same key using required: false to shadow a default', () => {
    it('keeps the key required because the fallback declaration still writes it', () => {
      const MySerializer = (data: Pet) =>
        ObjectSerializer(data)
          .delegatedAttribute('defaultUser', 'name', { openapi: 'string' })
          .delegatedAttribute('user', 'name', { openapi: 'string', required: false })

      const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer)
      expect(serializerOpenapiRenderer.renderedOpenapi().openapi).toMatchObject({
        required: ['name'],
        properties: {
          name: {
            type: 'string',
          },
        },
      })
    })

    it('uses the renamed output key in properties and required when shadowing with as', () => {
      const MySerializer = (data: Pet) =>
        ObjectSerializer(data)
          .delegatedAttribute('defaultUser', 'name', { as: 'displayName', openapi: 'string' })
          .delegatedAttribute('user', 'name', {
            as: 'displayName',
            openapi: 'string',
            required: false,
          })

      const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer)
      expect(serializerOpenapiRenderer.renderedOpenapi().openapi).toMatchObject({
        required: ['displayName'],
        properties: {
          displayName: {
            type: 'string',
          },
        },
      })
    })
  })

  context('with `optional: true`', () => {
    it('adds null to the type', () => {
      const MySerializer = (data: Pet) =>
        ObjectSerializer(data).delegatedAttribute('user', 'name', { openapi: 'string', optional: true })

      const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer)
      expect(serializerOpenapiRenderer['renderedOpenapiAttributes']().attributes).toEqual({
        name: {
          type: ['string', 'null'],
        },
      })
    })

    it('keeps the property in the required fields (optional is OpenAPI nullable, not omit)', () => {
      const MySerializer = (data: Pet) =>
        ObjectSerializer(data).delegatedAttribute('user', 'name', { openapi: 'string', optional: true })

      const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
      expect((serializerOpenapiRenderer.renderedOpenapi().openapi as any).required).toEqual(['name'])
    })

    context('when the schema has no type, as with a $serializer ref', () => {
      it('is anyOf the ref or null', () => {
        const AddressSerializer = Object.assign(
          (data: Address) => ObjectSerializer(data).attribute('city', { openapi: 'string' }),
          { globalName: 'AddressSerializer', openapiName: 'Address' },
        )

        const MySerializer = (data: Pet) =>
          ObjectSerializer(data).delegatedAttribute('user', 'address', {
            openapi: { $serializer: AddressSerializer },
            optional: true,
          })

        const results = new SerializerOpenapiRenderer(MySerializer)['renderedOpenapiAttributes']()
        expect(results.attributes).toEqual({
          address: {
            anyOf: [{ $ref: '#/components/schemas/Address' }, { type: 'null' }],
          },
        })
        expect(results.referencedSerializers).toEqual([AddressSerializer])
      })
    })

    context('when the schema is an enum', () => {
      it('adds null to the type and to the enum', () => {
        const schema = optionalNameSchema({ type: 'string', enum: ['cat', 'noncat'] })

        expect(schema).toEqual({ type: ['string', 'null'], enum: ['cat', 'noncat', null] })
        expect(validates(schema, null)).toBe(true)
        expect(validates(schema, 'cat')).toBe(true)
        expect(validates(schema, 'noncat')).toBe(true)
        expect(validates(schema, 'dog')).toBe(false)
      })

      it('does not add a second null to an enum that already has one', () => {
        expect(optionalNameSchema({ type: 'string', enum: ['cat', null] })).toEqual({
          type: ['string', 'null'],
          enum: ['cat', null],
        })
      })
    })

    context('when the schema is a const', () => {
      it('adds null to the type and turns the const into an enum of it and null', () => {
        const schema = optionalNameSchema({ type: 'string', const: 'cat' } as OpenapiSchemaBodyShorthand)

        expect(schema).toEqual({ type: ['string', 'null'], enum: ['cat', null] })
        expect(validates(schema, null)).toBe(true)
        expect(validates(schema, 'cat')).toBe(true)
        expect(validates(schema, 'noncat')).toBe(false)
      })
    })

    context('when the schema applies a subschema beside its type', () => {
      // validates with the document's components alongside, as Psychic does
      const validatesInDocument = (schema: unknown, value: unknown) =>
        validates(
          { ...(schema as object), components: { schemas: { Species: { enum: ['cat', 'noncat'] } } } },
          value,
        )

      const schemasApplyingASubschema: [string, object][] = [
        ['allOf', { type: 'string', allOf: [{ enum: ['cat', 'noncat'] }] }],
        ['anyOf', { type: 'string', anyOf: [{ enum: ['cat'] }, { enum: ['noncat'] }] }],
        ['oneOf', { type: 'string', oneOf: [{ enum: ['cat'] }, { enum: ['noncat'] }] }],
        ['not', { type: 'string', not: { enum: ['dog'] } }],
        ['if', { type: 'string', if: { minLength: 4 }, then: { enum: ['noncat'] }, else: { enum: ['cat'] } }],
        ['$ref', { type: 'string', $ref: '#/components/schemas/Species' }],
        [
          'allOf, with a type that already includes null',
          { type: ['string', 'null'], allOf: [{ enum: ['cat', 'noncat'] }] },
        ],
      ]

      schemasApplyingASubschema.forEach(([description, schemaApplyingASubschema]) => {
        it(`is anyOf the schema or null (${description})`, () => {
          const schema = optionalNameSchema(schemaApplyingASubschema as OpenapiSchemaBodyShorthand)

          expect(schema).toEqual({ anyOf: [schemaApplyingASubschema, { type: 'null' }] })
          expect(validatesInDocument(schema, null)).toBe(true)
          expect(validatesInDocument(schema, 'cat')).toBe(true)
          expect(validatesInDocument(schema, 'noncat')).toBe(true)
          expect(validatesInDocument(schema, 'dog')).toBe(false)
        })
      })
    })
  })
})
