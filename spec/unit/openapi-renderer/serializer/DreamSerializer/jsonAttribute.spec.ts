import { DreamSerializer } from '@rvoh/dream'
import SerializerOpenapiRenderer from '../../../../../src/openapi-renderer/SerializerOpenapiRenderer.js'
import User from '../../../../../test-app/src/app/models/User.js'

describe('DreamSerializer json attributes', () => {
  context('all Dream column types', () => {
    const MySerializer = (data: User) =>
      DreamSerializer(User, data)
        .jsonAttribute('favoriteJsons', {
          openapi: {
            type: ['array', 'null'],
            items: { type: 'object', properties: { hello: 'string' } },
          },
        })
        .jsonAttribute('requiredFavoriteJsons', {
          openapi: {
            type: 'array',
            items: { type: 'object', properties: { hello: 'string' } },
          },
        })
        .jsonAttribute('favoriteJsonbs', {
          openapi: {
            type: ['array', 'null'],
            items: { type: 'object', properties: { hello: 'string' } },
          },
        })
        .jsonAttribute('requiredFavoriteJsonbs', {
          openapi: {
            type: 'array',
            items: { type: 'object', properties: { hello: 'string' } },
          },
        })
        .jsonAttribute('jsonData', { openapi: { type: ['object', 'null'], properties: { hello: 'string' } } })
        .jsonAttribute('requiredJsonData', { openapi: { type: 'object', properties: { hello: 'string' } } })
        .jsonAttribute('jsonbData', {
          openapi: { type: ['object', 'null'], properties: { hello: 'string' } },
        })
        .jsonAttribute('requiredJsonbData', { openapi: { type: 'object', properties: { hello: 'string' } } })

    it('have the correct OpenAPI shape', () => {
      const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer)
      expect(serializerOpenapiRenderer['renderedOpenapiAttributes']().attributes).toEqual({
        favoriteJsons: {
          type: ['array', 'null'],
          items: { type: 'object', properties: { hello: 'string' } },
        },
        requiredFavoriteJsons: { type: 'array', items: { type: 'object', properties: { hello: 'string' } } },
        favoriteJsonbs: {
          type: ['array', 'null'],
          items: { type: 'object', properties: { hello: 'string' } },
        },
        requiredFavoriteJsonbs: { type: 'array', items: { type: 'object', properties: { hello: 'string' } } },

        jsonData: { type: ['object', 'null'], properties: { hello: 'string' } },
        requiredJsonData: { type: 'object', properties: { hello: 'string' } },
        jsonbData: { type: ['object', 'null'], properties: { hello: 'string' } },
        requiredJsonbData: { type: 'object', properties: { hello: 'string' } },
      })
    })
  })

  context('with casing specified', () => {
    const MySerializer = (data: User) =>
      DreamSerializer(User, data).jsonAttribute('jsonData', {
        openapi: { type: 'object', properties: { hello: { type: 'string' } } },
      })

    context('snake casing is specified', () => {
      it('renders all attribute keys in snake case', () => {
        const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer, { casing: 'snake' })
        expect(serializerOpenapiRenderer['renderedOpenapiAttributes']().attributes).toEqual(
          expect.objectContaining({
            json_data: { type: 'object', properties: { hello: { type: 'string' } } },
          }),
        )
      })
    })

    context('camel casing is specified', () => {
      it('renders all attribute keys in camel case', () => {
        const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer, { casing: 'camel' })
        expect(serializerOpenapiRenderer['renderedOpenapiAttributes']().attributes).toEqual(
          expect.objectContaining({
            jsonData: { type: 'object', properties: { hello: { type: 'string' } } },
          }),
        )
      })
    })
  })
})
