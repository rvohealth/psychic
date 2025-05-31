/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { DreamSerializer } from '@rvoh/dream'
import SerializerOpenapiRenderer from '../../../../../src/openapi-renderer/SerializerOpenapiRenderer.js'
import User from '../../../../../test-app/src/app/models/User.js'

describe('DreamSerializer attributes', () => {
  it('can render Dream attributes', () => {
    const MySerializer = (data: User) => DreamSerializer(User, data).attribute('email')
    const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer)

    expect(serializerOpenapiRenderer.renderedOpenapi().openapi).toEqual(
      expect.objectContaining({
        type: 'object',
        required: ['email'],
      }),
    )
  })

  it('can alias Dream attributes', () => {
    const MySerializer = (data: User) => DreamSerializer(User, data).attribute('email', { as: 'email2' })
    const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer)

    expect(serializerOpenapiRenderer.renderedOpenapi().openapi).toEqual(
      expect.objectContaining({
        type: 'object',
        required: ['email2'],
      }),
    )
  })

  it('can render virtual Dream attributes', () => {
    const MySerializer = (data: User) =>
      DreamSerializer(User, data).attribute('openapiVirtualSpecTest', { openapi: 'decimal' })
    const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer)

    expect(serializerOpenapiRenderer.renderedOpenapi().openapi).toEqual(
      expect.objectContaining({
        type: 'object',
        required: ['openapiVirtualSpecTest'],
      }),
    )
  })

  it('can render attributes from serializers that "extend" other serializers', () => {
    const BaseSerializer = (data: User) => DreamSerializer(User, data).attribute('name')
    const MySerializer = (data: User) => BaseSerializer(data).attribute('email')
    const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer)

    expect(serializerOpenapiRenderer.renderedOpenapi().openapi).toEqual(
      expect.objectContaining({
        type: 'object',
        required: ['email', 'name'],
      }),
    )
  })

  context('with casing specified', () => {
    const MySerializer = (data: User) => DreamSerializer(User, data).attribute('requiredNicknames')

    context('snake casing is specified', () => {
      it('renders all attribute keys in snake case', () => {
        const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer, { casing: 'snake' })

        expect(serializerOpenapiRenderer.renderedOpenapi().openapi).toEqual(
          expect.objectContaining({
            type: 'object',
            required: ['required_nicknames'],
          }),
        )
      })
    })

    context('camel casing is specified', () => {
      it('renders all attribute keys in camel case', () => {
        const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer, { casing: 'camel' })

        expect(serializerOpenapiRenderer.renderedOpenapi().openapi).toEqual(
          expect.objectContaining({
            type: 'object',
            required: ['requiredNicknames'],
          }),
        )
      })
    })
  })

  context('$serializer', () => {
    it('converts $serializer to a $ref and tracks what serializers have been processed and need to be rendered', () => {
      const SerializerC = (data: User) => DreamSerializer(User, data)
      ;(SerializerC as any).globalName = 'SerializerC'
      ;(SerializerC as any).openapiName = 'SerializerC'

      const SerializerB = (data: User) =>
        DreamSerializer(User, data).customAttribute('mySerializerC', () => null, {
          openapi: { $serializer: SerializerC },
        })
      ;(SerializerB as any).globalName = 'SerializerB'
      ;(SerializerB as any).openapiName = 'SerializerB'

      const SerializerA = (data: User) =>
        DreamSerializer(User, data).customAttribute('mySerializerB', () => null, {
          openapi: { $serializer: SerializerB },
        })
      ;(SerializerA as any).globalName = 'SerializerA'
      ;(SerializerA as any).openapiName = 'SerializerA'

      const alreadyExtractedDescendantSerializers: Record<string, boolean> = {}

      const serializerAOpenapiRenderer = new SerializerOpenapiRenderer(SerializerA)
      const renderedA = serializerAOpenapiRenderer.renderedOpenapi(alreadyExtractedDescendantSerializers)

      expect(renderedA.openapi).toEqual(
        expect.objectContaining({
          type: 'object',
          required: ['mySerializerB'],
          properties: {
            mySerializerB: {
              $ref: '#/components/schemas/SerializerB',
            },
          },
        }),
      )

      expect(renderedA.referencedSerializers).toHaveLength(2)
      expect(renderedA.referencedSerializers).toEqual([SerializerB, SerializerC])

      expect(alreadyExtractedDescendantSerializers).toEqual({
        SerializerA: true,
        SerializerB: true,
        SerializerC: true,
      })

      const serializerBOpenapiRenderer = new SerializerOpenapiRenderer(SerializerB)
      const renderedB = serializerBOpenapiRenderer.renderedOpenapi(alreadyExtractedDescendantSerializers)

      expect(renderedB.openapi).toEqual(
        expect.objectContaining({
          type: 'object',
          required: ['mySerializerC'],
          properties: {
            mySerializerC: {
              $ref: '#/components/schemas/SerializerC',
            },
          },
        }),
      )

      expect(renderedB.referencedSerializers).toHaveLength(1)
      expect(renderedB.referencedSerializers).toEqual([SerializerC])

      const serializerCOpenapiRenderer = new SerializerOpenapiRenderer(SerializerC)
      const renderedC = serializerCOpenapiRenderer.renderedOpenapi(alreadyExtractedDescendantSerializers)

      expect(renderedC.openapi).toEqual(
        expect.objectContaining({
          type: 'object',
          required: [],
          properties: {},
        }),
      )
      expect(renderedC.referencedSerializers).toHaveLength(0)
    })

    context('in nested OpenAPI', () => {
      it('converts $serializer to a $ref and tracks what serializers have been processed and need to be rendered', () => {
        const SerializerC = (data: User) => DreamSerializer(User, data)
        ;(SerializerC as any).globalName = 'SerializerC'
        ;(SerializerC as any).openapiName = 'SerializerC'

        const SerializerB = (data: User) =>
          DreamSerializer(User, data).customAttribute('mySerializers', () => null, {
            openapi: { type: 'array', items: { $serializer: SerializerC } },
          })
        ;(SerializerB as any).globalName = 'SerializerB'
        ;(SerializerB as any).openapiName = 'SerializerB'

        const SerializerA = (data: User) =>
          DreamSerializer(User, data).customAttribute('myOuterObject', () => null, {
            openapi: { type: 'object', properties: { mySerializerB: { $serializer: SerializerB } } },
          })
        ;(SerializerA as any).globalName = 'SerializerA'
        ;(SerializerA as any).openapiName = 'SerializerA'

        const alreadyExtractedDescendantSerializers: Record<string, boolean> = {}

        const serializerAOpenapiRenderer = new SerializerOpenapiRenderer(SerializerA)
        const renderedA = serializerAOpenapiRenderer.renderedOpenapi(alreadyExtractedDescendantSerializers)

        expect(renderedA.openapi).toEqual(
          expect.objectContaining({
            type: 'object',
            required: ['myOuterObject'],
            properties: {
              myOuterObject: {
                type: 'object',
                properties: {
                  mySerializerB: {
                    $ref: '#/components/schemas/SerializerB',
                  },
                },
              },
            },
          }),
        )

        expect(renderedA.referencedSerializers).toHaveLength(2)
        expect(renderedA.referencedSerializers).toEqual([SerializerB, SerializerC])
        expect(alreadyExtractedDescendantSerializers).toEqual({
          SerializerA: true,
          SerializerB: true,
          SerializerC: true,
        })

        const serializerBOpenapiRenderer = new SerializerOpenapiRenderer(SerializerB)
        const renderedB = serializerBOpenapiRenderer.renderedOpenapi(alreadyExtractedDescendantSerializers)

        expect(renderedB.openapi).toEqual(
          expect.objectContaining({
            type: 'object',
            required: ['mySerializers'],
            properties: {
              mySerializers: {
                type: 'array',
                items: {
                  $ref: '#/components/schemas/SerializerC',
                },
              },
            },
          }),
        )
        expect(renderedB.referencedSerializers).toHaveLength(1)
        expect(renderedB.referencedSerializers).toEqual([SerializerC])

        const serializerCOpenapiRenderer = new SerializerOpenapiRenderer(SerializerC)
        const renderedC = serializerCOpenapiRenderer.renderedOpenapi(alreadyExtractedDescendantSerializers)

        expect(renderedC.openapi).toEqual(
          expect.objectContaining({
            type: 'object',
            required: [],
            properties: {},
          }),
        )
        expect(renderedC.referencedSerializers).toHaveLength(0)
      })
    })
  })
})
