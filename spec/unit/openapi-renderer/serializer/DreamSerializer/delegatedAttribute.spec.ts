import { DreamSerializer } from '@rvoh/dream'
import SerializerOpenapiRenderer from '../../../../../src/openapi-renderer/SerializerOpenapiRenderer.js'
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
})
