import { CalendarDate, ObjectSerializer } from '@rvoh/dream'
import SerializerOpenapiRenderer from '../../../../../src/openapi-renderer/SerializerOpenapiRenderer.js'

interface User {
  name?: string
  birthdate?: CalendarDate
}

interface Pet {
  name?: string
  user?: User
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

  context('with `optional: true`', () => {
    it('wraps the schema in anyOf with null', () => {
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
  })
})
