import { DreamSerializer } from '@rvoh/dream'
import SerializerOpenapiShapeOnJSONColumn from '../../../../../src/error/openapi/SerializerOpenapiShapeOnJSONColumn.js'
import SerializerOpenapiRenderer from '../../../../../src/openapi-renderer/SerializerOpenapiRenderer.js'
import Pet from '../../../../../test-app/src/app/models/Pet.js'
import User from '../../../../../test-app/src/app/models/User.js'

// the shapes test-app/src/app/models/User.ts declares with @deco.JSON
const requiredJsonbDataShape = {
  type: 'object',
  properties: { theme: { type: 'string', enum: ['light', 'dark'] }, fontSize: { type: 'integer' } },
}
const requiredFavoriteJsonbsElementShape = {
  type: 'object',
  properties: { label: { type: 'string' }, score: { type: 'number' } },
  required: ['label'],
}

describe('DreamSerializer json attributes', () => {
  context('all Dream column types', () => {
    const MySerializer = (data: User) =>
      DreamSerializer(User, data)
        .attribute('favoriteJsons', {
          openapi: {
            type: ['array', 'null'],
            items: { type: 'object', properties: { hello: 'string' } },
          },
        })
        .attribute('requiredFavoriteJsons', {
          openapi: {
            type: 'array',
            items: { type: 'object', properties: { hello: 'string' } },
          },
        })
        .attribute('favoriteJsonbs', {
          openapi: {
            type: ['array', 'null'],
            items: { type: 'object', properties: { hello: 'string' } },
          },
        })
        .attribute('jsonData', { openapi: { type: ['object', 'null'], properties: { hello: 'string' } } })
        .attribute('requiredJsonData', { openapi: { type: 'object', properties: { hello: 'string' } } })
        .attribute('jsonbData', {
          openapi: { type: ['object', 'null'], properties: { hello: 'string' } },
        })

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

        jsonData: { type: ['object', 'null'], properties: { hello: 'string' } },
        requiredJsonData: { type: 'object', properties: { hello: 'string' } },
        jsonbData: { type: ['object', 'null'], properties: { hello: 'string' } },
      })
    })
  })

  context('a column whose shape the model declares with @deco.JSON', () => {
    it('renders the declared shape without an openapi option', () => {
      const MySerializer = (data: User) => DreamSerializer(User, data).attribute('requiredJsonbData')

      const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer)
      expect(serializerOpenapiRenderer['renderedOpenapiAttributes']().attributes).toEqual({
        requiredJsonbData: requiredJsonbDataShape,
      })
    })

    it('renders an array column as an array of the declared element shape', () => {
      const MySerializer = (data: User) => DreamSerializer(User, data).attribute('requiredFavoriteJsonbs')

      const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer)
      expect(serializerOpenapiRenderer['renderedOpenapiAttributes']().attributes).toEqual({
        requiredFavoriteJsonbs: { type: 'array', items: requiredFavoriteJsonbsElementShape },
      })
    })

    it('layers a description onto the declared shape', () => {
      const MySerializer = (data: User) =>
        DreamSerializer(User, data).attribute('requiredJsonbData', {
          openapi: { description: 'Display preferences' },
        })

      const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer)
      expect(serializerOpenapiRenderer['renderedOpenapiAttributes']().attributes).toEqual({
        requiredJsonbData: { ...requiredJsonbDataShape, description: 'Display preferences' },
      })
    })

    it('refuses a shape in the openapi option, by type and when rendered', () => {
      const MySerializer = (data: User) =>
        // @ts-expect-error a @deco.JSON column takes only a description
        DreamSerializer(User, data).attribute('requiredJsonbData', {
          openapi: { type: 'object', properties: { hello: 'string' } },
        })

      const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer)
      expect(() => serializerOpenapiRenderer['renderedOpenapiAttributes']()).toThrow(
        SerializerOpenapiShapeOnJSONColumn,
      )
    })

    it('refuses a primitive shorthand in the openapi option when rendered', () => {
      const MySerializer = (data: User) =>
        DreamSerializer(User, data).attribute('requiredJsonbData', {
          openapi: 'json' as unknown as { description: string },
        })

      const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer)
      expect(() => serializerOpenapiRenderer['renderedOpenapiAttributes']()).toThrow(
        SerializerOpenapiShapeOnJSONColumn,
      )
    })

    context('delegatedAttribute', () => {
      it("renders the target model's declared shape without an openapi option", () => {
        const MySerializer = (data: Pet) =>
          DreamSerializer(Pet, data)
            .delegatedAttribute('user', 'requiredJsonbData')
            .delegatedAttribute('user', 'requiredFavoriteJsonbs')

        const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer)
        expect(serializerOpenapiRenderer['renderedOpenapiAttributes']().attributes).toEqual({
          requiredJsonbData: requiredJsonbDataShape,
          requiredFavoriteJsonbs: { type: 'array', items: requiredFavoriteJsonbsElementShape },
        })
      })

      it('adds null when the delegation is optional', () => {
        const MySerializer = (data: Pet) =>
          DreamSerializer(Pet, data).delegatedAttribute('user', 'requiredJsonbData', { optional: true })

        const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer)
        expect(serializerOpenapiRenderer['renderedOpenapiAttributes']().attributes).toEqual({
          requiredJsonbData: { ...requiredJsonbDataShape, type: ['object', 'null'] },
        })
      })

      it('refuses a shape in the openapi option when rendered', () => {
        const MySerializer = (data: Pet) =>
          DreamSerializer(Pet, data).delegatedAttribute('user', 'requiredJsonbData', {
            // @ts-expect-error a @deco.JSON column takes only a description
            openapi: { type: 'object' },
          })

        const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer)
        expect(() => serializerOpenapiRenderer['renderedOpenapiAttributes']()).toThrow(
          SerializerOpenapiShapeOnJSONColumn,
        )
      })
    })
  })

  context('with casing specified', () => {
    const MySerializer = (data: User) =>
      DreamSerializer(User, data).attribute('jsonData', {
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
