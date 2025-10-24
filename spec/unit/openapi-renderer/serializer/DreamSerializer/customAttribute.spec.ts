import { DreamSerializer } from '@rvoh/dream'
import { round } from '@rvoh/dream/utils'
import SerializerOpenapiRenderer from '../../../../../src/openapi-renderer/SerializerOpenapiRenderer.js'
import Pet from '../../../../../test-app/src/app/models/Pet.js'
import User from '../../../../../test-app/src/app/models/User.js'
import UserSerializer from '../../../../../test-app/src/app/serializers/UserSerializer.js'
import { SpeciesTypesEnumValues } from '../../../../../test-app/src/types/db.js'

describe('DreamSerializer customAttributes', () => {
  it('can render the results of calling the callback function', () => {
    const MySerializer = (user: User) =>
      DreamSerializer(User, user).customAttribute('email', () => `${user.email}@peanuts.com`, {
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
      DreamSerializer(User, data).customAttribute('birthdate', () => data.birthdate?.toDateTime(), {
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
    const MySerializer = (data: User) =>
      DreamSerializer(User, data).customAttribute('volume', () => round(data.volume ?? 0), {
        openapi: {
          type: 'integer',
          format: undefined,
          description: 'Volume as an integer',
        },
      })

    const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer)
    expect(serializerOpenapiRenderer['renderedOpenapiAttributes']().attributes).toEqual({
      volume: {
        type: 'integer',
        description: 'Volume as an integer',
      },
    })
  })

  context('with passthrough data', () => {
    it('when rendering a serializer directly, all passthrough data must be sent into the serializer, not into the render call', () => {
      const MySerializer = (data: User, passthroughData: { passthrough1?: string; passthrough2?: string }) =>
        DreamSerializer(User, data, passthroughData).customAttribute(
          'myString',
          () => `${passthroughData.passthrough1}, ${passthroughData.passthrough2}`,
          { openapi: 'string' },
        )

      const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer)
      expect(serializerOpenapiRenderer['renderedOpenapiAttributes']().attributes).toEqual({
        myString: {
          type: 'string',
        },
      })
    })
  })

  context('when serializing null', () => {
    it('renders the attributes as null', () => {
      const MySerializer = (user: User | null) =>
        DreamSerializer(User, user).customAttribute('email', () => `${user!.email}@peanuts.com`, {
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

  context('when the OpenAPI shape is specified via $serializable', () => {
    it('renders the serializable model’s default serializer and includes the referenced serializer in the returned referencedSerializers array', () => {
      const MySerializer = (data: Pet) =>
        DreamSerializer(Pet, data).customAttribute('user', () => null, { openapi: { $serializable: User } })

      const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer)
      const results = serializerOpenapiRenderer['renderedOpenapiAttributes']()
      expect(results.attributes).toEqual({
        user: {
          $ref: '#/components/schemas/User',
        },
      })

      expect(results.referencedSerializers).toEqual([UserSerializer])
    })
  })

  context('flatten', () => {
    it('renders the serialized data into this model and adjusts the OpenAPI spec accordingly', () => {
      const MySerializer = (data: Pet) =>
        DreamSerializer(Pet, data)
          .attribute('species')
          .customAttribute('user', () => null, {
            flatten: true,
            openapi: {
              $serializer: UserSerializer,
            },
          })
      const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer)
      const results = serializerOpenapiRenderer.renderedOpenapi()
      expect(results.openapi).toEqual({
        allOf: [
          {
            type: 'object',
            required: ['species'],
            properties: {
              species: { type: ['string', 'null'], enum: [...SpeciesTypesEnumValues, null] },
            },
          },
          {
            $ref: '#/components/schemas/User',
          },
        ],
      })

      expect(results.referencedSerializers).toHaveLength(1)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
      expect((results.referencedSerializers[0] as any).globalName).toEqual('UserSerializer')
    })

    context('when a $serializable is specified', () => {
      it('first determines the serializer, then renders the serialized data into this model and adjusts the OpenAPI spec accordingly', () => {
        const MySerializer = (data: Pet) =>
          DreamSerializer(Pet, data)
            .attribute('species')
            .customAttribute('user', () => null, {
              flatten: true,
              openapi: {
                $serializable: User,
              },
            })
        const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer)
        const results = serializerOpenapiRenderer.renderedOpenapi()
        expect(results.openapi).toEqual({
          allOf: [
            {
              type: 'object',
              required: ['species'],
              properties: {
                species: { type: ['string', 'null'], enum: [...SpeciesTypesEnumValues, null] },
              },
            },
            {
              $ref: '#/components/schemas/User',
            },
          ],
        })

        expect(results.referencedSerializers).toHaveLength(1)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
        expect((results.referencedSerializers[0] as any).globalName).toEqual('UserSerializer')
      })

      context('when a $serializableSerializerKey is specified', () => {
        it('uses the serializer corresponding to the serializer key', () => {
          const MySerializer = (data: Pet) =>
            DreamSerializer(Pet, data)
              .attribute('species')
              .customAttribute('user', () => null, {
                flatten: true,
                openapi: {
                  $serializable: User,
                  $serializableSerializerKey: 'summary',
                },
              })
          const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer)
          const results = serializerOpenapiRenderer.renderedOpenapi()
          expect(results.openapi).toEqual({
            allOf: [
              {
                type: 'object',
                required: ['species'],
                properties: {
                  species: { type: ['string', 'null'], enum: [...SpeciesTypesEnumValues, null] },
                },
              },
              {
                $ref: '#/components/schemas/UserSummary',
              },
            ],
          })

          expect(results.referencedSerializers).toHaveLength(1)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
          expect((results.referencedSerializers[0] as any).globalName).toEqual('UserSummarySerializer')
        })
      })
    })

    context('when optional and flatten', () => {
      it('the other association is wrapped in anyOf with null', () => {
        const MySerializer = (data: Pet) =>
          DreamSerializer(Pet, data)
            .attribute('species')
            .rendersOne('user', { flatten: true, optional: true })

        const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer)
        const results = serializerOpenapiRenderer.renderedOpenapi()
        expect(results.openapi).toEqual({
          allOf: [
            {
              type: 'object',
              required: ['species'],
              properties: {
                species: { type: ['string', 'null'], enum: [...SpeciesTypesEnumValues, null] },
              },
            },
            {
              anyOf: [
                {
                  $ref: '#/components/schemas/User',
                },
                {
                  type: 'null',
                },
              ],
            },
          ],
        })

        expect(results.referencedSerializers).toHaveLength(1)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
        expect((results.referencedSerializers[0] as any).globalName).toEqual('UserSerializer')
      })
    })
  })
})
