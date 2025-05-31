/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { DreamSerializer } from '@rvoh/dream'
import SerializerOpenapiRenderer from '../../../../../src/openapi-renderer/SerializerOpenapiRenderer.js'
import Balloon from '../../../../../test-app/src/app/models/Balloon.js'
import Pet from '../../../../../test-app/src/app/models/Pet.js'
import User from '../../../../../test-app/src/app/models/User.js'
import UserSerializer from '../../../../../test-app/src/app/serializers/UserSerializer.js'
import { SpeciesTypesEnumValues } from '../../../../../test-app/src/types/db.js'

describe('DreamSerializer rendersOne', () => {
  it('renders the Dream model’s default serializer and includes the referenced serializer in the returned referencedSerializers array', () => {
    const MySerializer = (data: Pet) => DreamSerializer(Pet, data).rendersOne('user')

    const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer)
    const results = serializerOpenapiRenderer['renderedOpenapiAttributes']()
    expect(results.attributes).toEqual({
      user: {
        $ref: '#/components/schemas/User',
      },
    })

    expect(results.referencedSerializers).toEqual([UserSerializer])
  })

  context('when there is no associated model', () => {
    it('renders null', () => {
      const MySerializer = (data: Pet) => DreamSerializer(Pet, data).rendersOne('user')

      const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer)
      expect(serializerOpenapiRenderer['renderedOpenapiAttributes']().attributes).toEqual({
        user: {
          $ref: '#/components/schemas/User',
        },
      })
    })
  })

  context('when optional', () => {
    it('the association is anyOf the ref or null', () => {
      const MySerializer = (data: Pet) => DreamSerializer(Pet, data).rendersOne('user', { optional: true })

      const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer)
      expect(serializerOpenapiRenderer['renderedOpenapiAttributes']().attributes).toEqual({
        user: {
          anyOf: [
            {
              $ref: '#/components/schemas/User',
            },
            { type: 'null' },
          ],
        },
      })
    })
  })

  context('optional inferred from the association', () => {
    it('the association is anyOf the ref or null', () => {
      const MySerializer = (data: Balloon) => DreamSerializer(Balloon, data).rendersOne('user')

      const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer)
      expect(serializerOpenapiRenderer['renderedOpenapiAttributes']().attributes).toEqual({
        user: {
          anyOf: [
            {
              $ref: '#/components/schemas/User',
            },
            { type: 'null' },
          ],
        },
      })
    })
  })

  it('supports specifying a specific serializerKey', () => {
    const MySerializer = (data: Pet) =>
      DreamSerializer(Pet, data).rendersOne('user', { serializerKey: 'summary' })

    const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer)
    expect(serializerOpenapiRenderer['renderedOpenapiAttributes']().attributes).toEqual({
      user: {
        $ref: '#/components/schemas/UserSummary',
      },
    })
  })

  it("supports customizing the name of the thing rendered via { as: '...' } (replaces `source: string`)", () => {
    const MySerializer = (data: Pet) => DreamSerializer(Pet, data).rendersOne('user', { as: 'user2' })

    const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer)
    expect(serializerOpenapiRenderer['renderedOpenapiAttributes']().attributes).toEqual({
      user2: {
        $ref: '#/components/schemas/User',
      },
    })
  })

  context('flatten', () => {
    it('renders the serialized data into this model and adjusts the OpenAPI spec accordingly', () => {
      const MySerializer = (data: Pet) =>
        DreamSerializer(Pet, data).attribute('species').rendersOne('user', { flatten: true })

      const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer)
      const results = serializerOpenapiRenderer.renderedOpenapi()
      expect(results.openapi).toEqual({
        allOf: [
          {
            type: 'object',
            required: ['species'],
            properties: {
              species: { type: ['string', 'null'], enum: SpeciesTypesEnumValues },
            },
          },
          {
            $ref: '#/components/schemas/User',
          },
        ],
      })

      expect(results.referencedSerializers).toHaveLength(1)
      expect((results.referencedSerializers[0] as any).globalName).toEqual('UserSerializer')
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
                species: { type: ['string', 'null'], enum: SpeciesTypesEnumValues },
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
        expect((results.referencedSerializers[0] as any).globalName).toEqual('UserSerializer')
      })
    })
  })

  it('supports supplying a custom serializer', () => {
    const CustomSerializer = (data: User) => DreamSerializer(User, data).attribute('name')
    ;(CustomSerializer as any).globalName = 'CustomUserSerializer'
    ;(CustomSerializer as any).openapiName = 'CustomUser'
    const MySerializer = (data: Pet) =>
      DreamSerializer(Pet, data).rendersOne('user', { serializer: CustomSerializer })

    const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer)
    expect(serializerOpenapiRenderer['renderedOpenapiAttributes']().attributes).toEqual({
      user: {
        $ref: '#/components/schemas/CustomUser',
      },
    })
  })

  it('passes passthrough data', () => {
    interface PassthroughData {
      locale: 'en-US' | 'es-ES'
    }

    const CustomSerializer = (data: User, passthroughData: PassthroughData) =>
      DreamSerializer(User, data, passthroughData).customAttribute(
        'title',
        () => `${passthroughData.locale}-${data.name}`,
        { openapi: 'string' },
      )
    ;(CustomSerializer as any).globalName = 'CustomUserSerializer'
    ;(CustomSerializer as any).openapiName = 'CustomUser'
    const MySerializer = (data: Pet) =>
      DreamSerializer(Pet, data).rendersOne('user', { serializer: CustomSerializer })

    const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer)
    expect(serializerOpenapiRenderer['renderedOpenapiAttributes']().attributes).toEqual({
      user: {
        $ref: '#/components/schemas/CustomUser',
      },
    })
  })
})
