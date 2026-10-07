/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { DreamSerializer } from '@rvoh/dream'
import SerializerOpenapiRenderer from '../../../../../src/openapi-renderer/SerializerOpenapiRenderer.js'
import Balloon from '../../../../../test-app/src/app/models/Balloon.js'
import Pet from '../../../../../test-app/src/app/models/Pet.js'
import User from '../../../../../test-app/src/app/models/User.js'
import UserSerializer from '../../../../../test-app/src/app/serializers/UserSerializer.js'
import { BalloonColorsEnumValues, SpeciesTypesEnumValues } from '../../../../../test-app/src/types/db.js'

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

  context('when the BelongsTo association is not optional', () => {
    it('the association is the ref, without null', () => {
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

    context('with a custom serializer', () => {
      const CustomSerializer = (data: User) => DreamSerializer(User, data).attribute('name')
      ;(CustomSerializer as any).globalName = 'CustomUserSerializer'
      ;(CustomSerializer as any).openapiName = 'CustomUser'

      it('the association is anyOf the custom serializer’s ref or null', () => {
        const MySerializer = (data: Balloon) =>
          DreamSerializer(Balloon, data).rendersOne('user', { serializer: CustomSerializer })

        const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer)
        const results = serializerOpenapiRenderer['renderedOpenapiAttributes']()
        expect(results.attributes).toEqual({
          user: {
            anyOf: [
              {
                $ref: '#/components/schemas/CustomUser',
              },
              { type: 'null' },
            ],
          },
        })

        expect(results.referencedSerializers).toEqual([CustomSerializer])
      })

      context('when flatten', () => {
        it('the association is the custom serializer, or an object whose fields, when present, are null', () => {
          const MySerializer = (data: Balloon) =>
            DreamSerializer(Balloon, data)
              .attribute('color')
              .rendersOne('user', { serializer: CustomSerializer, flatten: true })

          const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer)
          const results = serializerOpenapiRenderer.renderedOpenapi()
          expect(results.openapi).toEqual({
            type: 'object',
            allOf: [
              {
                type: 'object',
                required: ['color'],
                properties: {
                  color: { type: ['string', 'null'], enum: [...BalloonColorsEnumValues, null] },
                },
              },
              {
                anyOf: [
                  {
                    $ref: '#/components/schemas/CustomUser',
                  },
                  {
                    type: 'object',
                    properties: {
                      name: { type: 'null' },
                    },
                  },
                ],
              },
            ],
            unevaluatedProperties: false,
          })

          expect(results.referencedSerializers).toEqual([CustomSerializer])
        })
      })

      context('when optional: false is specified', () => {
        it('the association is the custom serializer’s ref, without null', () => {
          const MySerializer = (data: Balloon) =>
            DreamSerializer(Balloon, data).rendersOne('user', {
              serializer: CustomSerializer,
              optional: false,
            })

          const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer)
          expect(serializerOpenapiRenderer['renderedOpenapiAttributes']().attributes).toEqual({
            user: {
              $ref: '#/components/schemas/CustomUser',
            },
          })
        })
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
        type: 'object',
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
        unevaluatedProperties: false,
      })

      expect(results.referencedSerializers).toHaveLength(1)
      expect((results.referencedSerializers[0] as any).globalName).toEqual('UserSerializer')
    })

    context('when optional and flatten', () => {
      it('the association is its serializer, or an object whose fields, when present, are null', () => {
        const MySerializer = (data: Pet) =>
          DreamSerializer(Pet, data)
            .attribute('species')
            .rendersOne('user', { flatten: true, optional: true })

        const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer)
        const results = serializerOpenapiRenderer.renderedOpenapi()
        expect(results.openapi).toEqual({
          type: 'object',
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
                  type: 'object',
                  properties: {
                    email: { type: 'null' },
                    id: { type: 'null' },
                    name: { type: 'null' },
                  },
                },
              ],
            },
          ],
          unevaluatedProperties: false,
        })

        expect(results.referencedSerializers).toHaveLength(1)
        expect((results.referencedSerializers[0] as any).globalName).toEqual('UserSerializer')
      })
    })
  })

  context('with casing specified', () => {
    context('snake casing', () => {
      it('applies snake casing to attribute and required names', () => {
        const MySerializer = (data: Pet) =>
          DreamSerializer(Pet, data).rendersOne('user', { as: 'primaryUser' })

        const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer, { casing: 'snake' })
        const results = serializerOpenapiRenderer.renderedOpenapi()
        expect(results.openapi).toEqual({
          type: 'object',
          required: ['primary_user'],
          properties: {
            primary_user: {
              $ref: '#/components/schemas/User',
            },
          },
        })
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
