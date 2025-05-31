import { CalendarDate, ObjectSerializer } from '@rvoh/dream'
import SerializerOpenapiRenderer from '../../../../../src/openapi-renderer/SerializerOpenapiRenderer.js'

interface User {
  email: string
  password: string
  name?: string
  birthdate?: CalendarDate
}

interface ModelForOpenapiTypeSpecs {
  volume?: number
  requiredNicknames?: string[]
}

describe('ObjectSerializer attributes', () => {
  it('can render attributes', () => {
    const MySerializer = (data: User) => ObjectSerializer(data).attribute('email', { openapi: 'string' })

    const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer)
    expect(serializerOpenapiRenderer['renderedOpenapiAttributes']().attributes).toEqual({
      email: {
        type: 'string',
      },
    })
  })

  it('supports customizing the name of the thing rendered', () => {
    const MySerializer = (data: User) =>
      ObjectSerializer(data).attribute('email', { openapi: 'string', as: 'email2' })

    const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer)
    expect(serializerOpenapiRenderer['renderedOpenapiAttributes']().attributes).toEqual({
      email2: {
        type: 'string',
      },
    })
  })

  it('can specify OpenAPI description', () => {
    const MySerializer = (data: User) =>
      ObjectSerializer(data).attribute('email', {
        openapi: { type: 'string', description: 'This is an email' },
      })

    const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer)
    expect(serializerOpenapiRenderer['renderedOpenapiAttributes']().attributes).toEqual({
      email: {
        type: 'string',
        description: 'This is an email',
      },
    })
  })

  context('when serializing null', () => {
    it('renderedAttributes is null', () => {
      const MySerializer = (data: User | null) =>
        ObjectSerializer(data).attribute('email', { openapi: 'string' })

      const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer)
      expect(serializerOpenapiRenderer['renderedOpenapiAttributes']().attributes).toEqual({
        email: {
          type: 'string',
        },
      })
    })
  })

  it('can render attributes from serializers that "extend" other serializers', () => {
    const BaseSerializer = (data: User) =>
      ObjectSerializer(data).attribute('name', { openapi: ['string', 'null'] })
    const MySerializer = (data: User) => BaseSerializer(data).attribute('email', { openapi: 'string' })

    const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer)
    expect(serializerOpenapiRenderer['renderedOpenapiAttributes']().attributes).toEqual({
      name: {
        type: ['string', 'null'],
      },
      email: {
        type: 'string',
      },
    })
  })

  context('with casing specified', () => {
    const MySerializer = (data: ModelForOpenapiTypeSpecs) =>
      ObjectSerializer(data).attribute('requiredNicknames', { openapi: 'string[]' })

    context('snake casing is specified', () => {
      it('renders all attribute keys in snake case', () => {
        const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer, { casing: 'snake' })
        expect(serializerOpenapiRenderer['renderedOpenapiAttributes']().attributes).toEqual({
          required_nicknames: { type: 'array', items: { type: 'string' } },
        })
      })
    })

    context('camel casing is specified', () => {
      it('renders all attribute keys in camel case', () => {
        const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer, { casing: 'camel' })
        expect(serializerOpenapiRenderer['renderedOpenapiAttributes']().attributes).toEqual(
          expect.objectContaining({
            requiredNicknames: { type: 'array', items: { type: 'string' } },
          }),
        )
      })
    })
  })
})
