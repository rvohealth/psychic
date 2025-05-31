/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { DreamSerializer } from '@rvoh/dream'
import SerializerOpenapiRenderer from '../../../../../src/openapi-renderer/SerializerOpenapiRenderer.js'
import Balloon from '../../../../../test-app/src/app/models/Balloon.js'
import Pet from '../../../../../test-app/src/app/models/Pet.js'
import User from '../../../../../test-app/src/app/models/User.js'

describe('DreamSerializer rendersMany', () => {
  it('renders the associated objects', () => {
    const MySerializer = (data: User) => DreamSerializer(User, data).rendersMany('pets')

    const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer)
    const results = serializerOpenapiRenderer['renderedOpenapiAttributes']()
    expect(results.attributes).toEqual({
      pets: {
        type: 'array',
        items: {
          $ref: '#/components/schemas/Pet',
        },
      },
    })

    expect(results.referencedSerializers).toHaveLength(1)
    expect((results.referencedSerializers[0] as any).globalName).toEqual('PetSerializer')
  })

  it('expands STI base model into OpenAPI for all of the child types', () => {
    const MySerializer = (data: User) => DreamSerializer(User, data).rendersMany('balloons')

    const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer)
    const results = serializerOpenapiRenderer['renderedOpenapiAttributes']()
    expect(results.attributes).toEqual({
      balloons: {
        type: 'array',
        items: {
          anyOf: [
            {
              $ref: '#/components/schemas/BalloonLatex',
            },
            {
              $ref: '#/components/schemas/BalloonMylar',
            },
          ],
        },
      },
    })

    expect(results.referencedSerializers).toHaveLength(2)
    expect((results.referencedSerializers[0] as any).globalName).toEqual('Balloon/LatexSerializer')
    expect((results.referencedSerializers[1] as any).globalName).toEqual('Balloon/MylarSerializer')
  })

  context('STI $serializable', () => {
    it('expands STI base model into OpenAPI for all of the child types', () => {
      const MySerializer = (data: User) =>
        DreamSerializer(User, data).customAttribute('balloons', () => null, {
          openapi: { $serializable: Balloon },
        })

      const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer)
      const results = serializerOpenapiRenderer['renderedOpenapiAttributes']()
      expect(results.attributes).toEqual({
        balloons: {
          anyOf: [
            {
              $ref: '#/components/schemas/BalloonLatex',
            },
            {
              $ref: '#/components/schemas/BalloonMylar',
            },
          ],
        },
      })

      expect(results.referencedSerializers).toHaveLength(2)
      expect((results.referencedSerializers[0] as any).globalName).toEqual('Balloon/LatexSerializer')
      expect((results.referencedSerializers[1] as any).globalName).toEqual('Balloon/MylarSerializer')
    })
  })

  it('supports specifying the serializerKey', () => {
    const MySerializer = (data: User) =>
      DreamSerializer(User, data).rendersMany('pets', { serializerKey: 'summary' })

    const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer)
    const results = serializerOpenapiRenderer['renderedOpenapiAttributes']()
    expect(results.attributes).toEqual({
      pets: {
        type: 'array',
        items: {
          $ref: '#/components/schemas/PetSummary',
        },
      },
    })

    expect(results.referencedSerializers).toHaveLength(1)
    expect((results.referencedSerializers[0] as any).globalName).toEqual('PetSummarySerializer')
  })

  it("supports customizing the name of the thing rendered via { as: '...' } (replaces `source: string`)", () => {
    const MySerializer = (data: User) => DreamSerializer(User, data).rendersMany('pets', { as: 'pets2' })

    const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer)
    const results = serializerOpenapiRenderer['renderedOpenapiAttributes']()
    expect(results.attributes).toEqual({
      pets2: {
        type: 'array',
        items: {
          $ref: '#/components/schemas/Pet',
        },
      },
    })

    expect(results.referencedSerializers).toHaveLength(1)
    expect((results.referencedSerializers[0] as any).globalName).toEqual('PetSerializer')
  })

  it('supports supplying a custom serializer', () => {
    const CustomSerializer = (data: Pet) => DreamSerializer(Pet, data).attribute('name')
    ;(CustomSerializer as any).globalName = 'CustomPetSerializer'
    ;(CustomSerializer as any).openapiName = 'CustomPet'
    const MySerializer = (data: User) =>
      DreamSerializer(User, data).rendersMany('pets', { serializer: CustomSerializer })

    const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer)
    const results = serializerOpenapiRenderer['renderedOpenapiAttributes']()
    expect(results.attributes).toEqual({
      pets: {
        type: 'array',
        items: {
          $ref: '#/components/schemas/CustomPet',
        },
      },
    })

    expect(results.referencedSerializers).toEqual([CustomSerializer])
  })
})
