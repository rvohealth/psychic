import { CalendarDate, ObjectSerializer } from '@rvoh/dream'
import { round } from '@rvoh/dream/utils'
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
  birthdate?: CalendarDate
}

describe('ObjectSerializer customAttributes', () => {
  it('can render the results of calling the callback function', () => {
    const MySerializer = (user: User) =>
      ObjectSerializer(user).customAttribute('email', () => `${user.email}@peanuts.com`, {
        openapi: 'string',
      })

    const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer)
    expect(serializerOpenapiRenderer['renderedOpenapiAttributes']().attributes).toEqual({
      email: {
        type: 'string',
      },
    })
  })

  it('can override the OpenAPI shape with OpenAPI shorthand', () => {
    const MySerializer = (data: User) =>
      ObjectSerializer(data).customAttribute('birthdate', () => data.birthdate?.toDateTime()?.toISO(), {
        openapi: 'date-time',
      })

    const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer)
    expect(serializerOpenapiRenderer['renderedOpenapiAttributes']().attributes).toEqual({
      birthdate: {
        type: 'string',
        format: 'date-time',
      },
    })
  })

  it('can override the OpenAPI shape with an OpenAPI object', () => {
    const MySerializer = (data: ModelForOpenapiTypeSpecs) =>
      ObjectSerializer(data).customAttribute('volume', () => round(data.volume ?? 0), {
        openapi: { type: 'integer', format: undefined, description: 'Volume as an integer' },
      })

    const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer)
    expect(serializerOpenapiRenderer['renderedOpenapiAttributes']().attributes).toEqual({
      volume: {
        type: 'integer',
        description: 'Volume as an integer',
      },
    })
  })

  context('with `required: false`', () => {
    it('omits the property from the required fields in the rendered OpenAPI', () => {
      const MySerializer = (user: User) =>
        ObjectSerializer(user).customAttribute('email', () => `${user.email}@peanuts.com`, {
          openapi: { type: 'string' },
          required: false,
        })

      const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
      expect((serializerOpenapiRenderer.renderedOpenapi().openapi as any).required).toEqual([])
    })
  })

  context('with passthrough data', () => {
    it('can access the passthrough data in the function', () => {
      const MySerializer = (user: User, passthroughData: { locale: string }) =>
        ObjectSerializer(user, passthroughData).customAttribute(
          'email',
          () => `${user.email}.${passthroughData.locale}@peanuts.com`,
          { openapi: 'string' },
        )

      const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer)
      expect(serializerOpenapiRenderer['renderedOpenapiAttributes']().attributes).toEqual({
        email: {
          type: 'string',
        },
      })
    })
  })

  context('when serializing null', () => {
    it('renders the attributes as null', () => {
      const MySerializer = (user: User | null) =>
        ObjectSerializer(user).customAttribute('email', () => `${user!.email}@peanuts.com`, {
          openapi: 'string',
        })

      const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer)
      expect(serializerOpenapiRenderer['renderedOpenapiAttributes']().attributes).toEqual({
        email: {
          type: 'string',
        },
      })
    })
  })
})
