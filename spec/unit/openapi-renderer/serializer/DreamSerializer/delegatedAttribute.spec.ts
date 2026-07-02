import { DreamSerializer } from '@rvoh/dream'
import SerializerOpenapiRenderer from '../../../../../src/openapi-renderer/SerializerOpenapiRenderer.js'
import Balloon from '../../../../../test-app/src/app/models/Balloon.js'
import Pet from '../../../../../test-app/src/app/models/Pet.js'

describe('DreamSerializer delegated attributes', () => {
  it('delegates value and type to the specified target', () => {
    const MySerializer = (data: Pet) =>
      DreamSerializer(Pet, data).delegatedAttribute('user', 'name').delegatedAttribute('user', 'birthdate')

    const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer)
    expect(serializerOpenapiRenderer['renderedOpenapiAttributes']().attributes).toEqual({
      name: {
        type: ['string', 'null'],
      },
      birthdate: {
        type: ['string', 'null'],
        format: 'date',
      },
    })
  })

  it('can override with explicitly provided OpenAPI shapes', () => {
    const MySerializer = (data: Pet) =>
      DreamSerializer(Pet, data)
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

  context('with explicit optional', () => {
    context('when the column is already nullable', () => {
      it('does not redundantly wrap with null', () => {
        const MySerializer = (data: Pet) =>
          DreamSerializer(Pet, data).delegatedAttribute('user', 'name', { optional: true })

        const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer)
        expect(serializerOpenapiRenderer['renderedOpenapiAttributes']().attributes).toEqual({
          name: {
            type: ['string', 'null'],
          },
        })
      })
    })

    context('when the column is non-nullable', () => {
      it('wraps the schema in anyOf with null', () => {
        const MySerializer = (data: Pet) =>
          DreamSerializer(Pet, data).delegatedAttribute('user', 'passwordDigest', { optional: true })

        const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer)
        expect(serializerOpenapiRenderer['renderedOpenapiAttributes']().attributes).toEqual({
          passwordDigest: {
            type: ['string', 'null'],
          },
        })
      })
    })

    context('when the delegated target is a @deco.Virtual column', () => {
      it('wraps the virtual column schema with null', () => {
        const MySerializer = (data: Pet) =>
          DreamSerializer(Pet, data).delegatedAttribute('user', 'password', { optional: true })

        const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer)
        expect(serializerOpenapiRenderer['renderedOpenapiAttributes']().attributes).toEqual({
          password: {
            type: ['string', 'null'],
          },
        })
      })
    })
  })

  context('with `required: false`', () => {
    it('omits the delegated property from the required fields in the rendered OpenAPI', () => {
      const MySerializer = (data: Pet) =>
        DreamSerializer(Pet, data)
          .delegatedAttribute('user', 'name', { required: false })
          .delegatedAttribute('user', 'birthdate')

      const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
      expect((serializerOpenapiRenderer.renderedOpenapi().openapi as any).required).toEqual(['birthdate'])
    })

    context('when the delegated target is a @deco.Virtual column', () => {
      it('omits the property from the required fields in the rendered OpenAPI', () => {
        const MySerializer = (data: Pet) =>
          DreamSerializer(Pet, data).delegatedAttribute('user', 'password', { required: false })

        const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
        expect((serializerOpenapiRenderer.renderedOpenapi().openapi as any).required).toEqual([])
      })
    })
  })

  context('when repeating the same key using required: false to shadow a default', () => {
    it('keeps the key required because the fallback declaration still writes it', () => {
      const MySerializer = (data: Pet) =>
        DreamSerializer(Pet, data)
          .delegatedAttribute('user', 'name', { openapi: 'string' })
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
        DreamSerializer(Pet, data)
          .delegatedAttribute('user', 'name', { as: 'displayName', openapi: 'string' })
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

  context('optional inferred from the association', () => {
    context('when the column is already nullable', () => {
      it('does not redundantly wrap with null', () => {
        const MySerializer = (data: Balloon) =>
          DreamSerializer(Balloon, data).delegatedAttribute('user', 'name')

        const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer)
        expect(serializerOpenapiRenderer['renderedOpenapiAttributes']().attributes).toEqual({
          name: {
            type: ['string', 'null'],
          },
        })
      })
    })

    context('when the column is non-nullable', () => {
      it('adds null to the type', () => {
        const MySerializer = (data: Balloon) =>
          DreamSerializer(Balloon, data).delegatedAttribute('user', 'passwordDigest')

        const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer)
        expect(serializerOpenapiRenderer['renderedOpenapiAttributes']().attributes).toEqual({
          passwordDigest: {
            type: ['string', 'null'],
          },
        })
      })
    })

    context('when the column is a non-nullable array', () => {
      it('adds null to the type and preserves items', () => {
        const MySerializer = (data: Balloon) =>
          DreamSerializer(Balloon, data).delegatedAttribute('user', 'requiredNicknames')

        const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer)
        expect(serializerOpenapiRenderer['renderedOpenapiAttributes']().attributes).toEqual({
          requiredNicknames: {
            type: ['array', 'null'],
            items: { type: 'string' },
          },
        })
      })
    })

    context('when the column is a nullable array', () => {
      it('does not redundantly wrap with null', () => {
        const MySerializer = (data: Balloon) =>
          DreamSerializer(Balloon, data).delegatedAttribute('user', 'nicknames')

        const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer)
        expect(serializerOpenapiRenderer['renderedOpenapiAttributes']().attributes).toEqual({
          nicknames: {
            type: ['array', 'null'],
            items: { type: 'string' },
          },
        })
      })
    })
  })
})
