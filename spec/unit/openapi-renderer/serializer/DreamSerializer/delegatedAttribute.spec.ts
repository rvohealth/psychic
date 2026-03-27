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
            anyOf: [{ type: 'string' }, { type: 'null' }],
          },
        })
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
      it('wraps the schema in anyOf with null', () => {
        const MySerializer = (data: Balloon) =>
          DreamSerializer(Balloon, data).delegatedAttribute('user', 'passwordDigest')

        const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer)
        expect(serializerOpenapiRenderer['renderedOpenapiAttributes']().attributes).toEqual({
          passwordDigest: {
            anyOf: [{ type: 'string' }, { type: 'null' }],
          },
        })
      })
    })
  })
})
