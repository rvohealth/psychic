import { CalendarDate, ObjectSerializer } from '@rvoh/dream'
import SerializerOpenapiRenderer from '../../../../../src/openapi-renderer/SerializerOpenapiRenderer.js'

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
  })
})
