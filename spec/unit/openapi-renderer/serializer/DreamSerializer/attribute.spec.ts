import { DreamSerializer } from '@rvoh/dream'
import SerializerOpenapiRenderer from '../../../../../src/openapi-renderer/SerializerOpenapiRenderer.js'
import User from '../../../../../test-app/src/app/models/User.js'
import UserSerializer from '../../../../../test-app/src/app/serializers/UserSerializer.js'
import { PetTreatsEnumValues, SpeciesTypesEnumValues } from '../../../../../test-app/src/types/db.js'

describe('DreamSerializer attributes', () => {
  it('can render Dream attributes', () => {
    const serializerOpenapiRenderer = new SerializerOpenapiRenderer(UserSerializer)
    expect(serializerOpenapiRenderer['renderedOpenapiAttributes']().attributes).toEqual({
      id: { type: 'integer' },
      name: { type: ['string', 'null'] },
      email: { type: 'string' },
    })
  })

  it('can render virtual Dream attributes', () => {
    const MySerializer = (data: User) =>
      // TODO: remove any cast when attribute stops requiring an openapi attribute for virtual columns
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      DreamSerializer(User, data).attribute('openapiVirtualSpecTest' as any)

    const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer)
    expect(serializerOpenapiRenderer['renderedOpenapiAttributes']().attributes).toEqual({
      openapiVirtualSpecTest: {
        type: ['string', 'null'],
      },
    })
  })

  it('can provide a description for a virtual Dream attribute', () => {
    const MySerializer = (data: User) =>
      // TODO: remove any cast when attribute stops requiring an openapi attribute for virtual columns
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      DreamSerializer(User, data).attribute('openapiVirtualSpecTest' as any, {
        openapi: { description: 'Hello world' },
      })

    const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer)
    expect(serializerOpenapiRenderer['renderedOpenapiAttributes']().attributes).toEqual({
      openapiVirtualSpecTest: {
        type: ['string', 'null'],
        description: 'Hello world',
      },
    })
  })

  it('can override virtual Dream attributes', () => {
    const MySerializer = (data: User) =>
      DreamSerializer(User, data).attribute('openapiVirtualSpecTest', { openapi: 'decimal' })

    const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer)
    expect(serializerOpenapiRenderer['renderedOpenapiAttributes']().attributes).toEqual({
      openapiVirtualSpecTest: {
        type: 'number',
        format: 'decimal',
      },
    })
  })

  it('supports customizing the name of the thing rendered', () => {
    const MySerializer = (data: User) => DreamSerializer(User, data).attribute('email', { as: 'email2' })

    const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer)
    expect(serializerOpenapiRenderer['renderedOpenapiAttributes']().attributes).toEqual({
      email2: {
        type: 'string',
      },
    })
  })

  it('can specify OpenAPI description', () => {
    const MySerializer = (data: User) =>
      DreamSerializer(User, data).attribute('email', { openapi: { description: 'This is an email' } })

    const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer)
    expect(serializerOpenapiRenderer['renderedOpenapiAttributes']().attributes).toEqual({
      email: {
        type: 'string',
        description: 'This is an email',
      },
    })
  })

  it('can render attributes from serializers that "extend" other serializers', () => {
    const BaseSerializer = (data: User) => DreamSerializer(User, data).attribute('name')
    const MySerializer = (data: User) => BaseSerializer(data).attribute('email')

    const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer)
    expect(serializerOpenapiRenderer['renderedOpenapiAttributes']().attributes).toEqual({
      name: {
        type: ['string', 'null'],
      },
      email: {
        type: 'string',
      },
    })
  })

  context('all Dream column types', () => {
    const MySerializer = (data: User) =>
      DreamSerializer(User, data)
        .attribute('name')
        .attribute('nicknames')
        .attribute('requiredNicknames')
        .attribute('email')
        .attribute('birthdate')
        .attribute('aDatetime')

        .attribute('volume')

        // begin: favorite records (used for checking type validation in Params.for)
        .attribute('favoriteCitext')
        .attribute('requiredFavoriteCitext')
        .attribute('favoriteCitexts')
        .attribute('requiredFavoriteCitexts')
        .attribute('favoriteUuids')
        .attribute('requiredFavoriteUuids')
        .attribute('favoriteDates')
        .attribute('requiredFavoriteDates')
        .attribute('favoriteDatetimes')
        .attribute('requiredFavoriteDatetimes')
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
        .attribute('requiredFavoriteJsonbs', {
          openapi: {
            type: 'array',
            items: { type: 'object', properties: { hello: 'string' } },
          },
        })
        .attribute('favoriteTexts')
        .attribute('requiredFavoriteTexts')
        .attribute('favoriteNumerics')
        .attribute('requiredFavoriteNumerics')
        .attribute('favoriteBooleans')
        .attribute('requiredFavoriteBooleans')
        .attribute('favoriteBigint')
        .attribute('requiredFavoriteBigint')
        .attribute('favoriteBigints')
        .attribute('requiredFavoriteBigints')
        .attribute('favoriteIntegers')
        .attribute('requiredFavoriteIntegers')
        // end: favorite records

        .attribute('bio')
        .attribute('notes')
        .attribute('jsonData', { openapi: { type: ['object', 'null'], properties: { hello: 'string' } } })
        .attribute('requiredJsonData', { openapi: { type: 'object', properties: { hello: 'string' } } })
        .attribute('jsonbData', {
          openapi: { type: ['object', 'null'], properties: { hello: 'string' } },
        })
        .attribute('requiredJsonbData', { openapi: { type: 'object', properties: { hello: 'string' } } })
        .attribute('uuid')
        .attribute('optionalUuid')

        .attribute('species')
        .attribute('favoriteTreats')
        .attribute('collarCount')
        .attribute('collarCountInt')
        .attribute('collarCountNumeric')
        .attribute('requiredCollarCount')
        .attribute('requiredCollarCountInt')
        .attribute('likesWalks')
        .attribute('likesTreats')
        .attribute('likesTreats')

    it('have the correct OpenAPI shape', () => {
      const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer)
      expect(serializerOpenapiRenderer['renderedOpenapiAttributes']().attributes).toEqual({
        name: { type: ['string', 'null'] },
        nicknames: { type: ['array', 'null'], items: { type: 'string' } },
        requiredNicknames: { type: 'array', items: { type: 'string' } },
        email: { type: 'string' },
        birthdate: { type: ['string', 'null'], format: 'date' },
        aDatetime: { type: ['string', 'null'], format: 'date-time' },

        volume: { type: ['number', 'null'], format: 'decimal' },

        // begin: favorite records (used for checking type validation in Params.for)
        favoriteCitext: { type: ['string', 'null'] },
        requiredFavoriteCitext: { type: 'string' },
        favoriteCitexts: { type: ['array', 'null'], items: { type: 'string' } },
        requiredFavoriteCitexts: { type: 'array', items: { type: 'string' } },
        favoriteUuids: { type: ['array', 'null'], items: { type: 'string' } },
        requiredFavoriteUuids: { type: 'array', items: { type: 'string' } },
        favoriteDates: { type: ['array', 'null'], items: { type: 'string', format: 'date' } },
        requiredFavoriteDates: { type: 'array', items: { type: 'string', format: 'date' } },
        favoriteDatetimes: { type: ['array', 'null'], items: { type: 'string', format: 'date-time' } },
        requiredFavoriteDatetimes: { type: 'array', items: { type: 'string', format: 'date-time' } },
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
        favoriteTexts: { type: ['array', 'null'], items: { type: 'string' } },
        requiredFavoriteTexts: { type: 'array', items: { type: 'string' } },
        favoriteNumerics: { type: ['array', 'null'], items: { type: 'number', format: 'decimal' } },
        requiredFavoriteNumerics: { type: 'array', items: { type: 'number', format: 'decimal' } },
        favoriteBooleans: { type: ['array', 'null'], items: { type: 'boolean' } },
        requiredFavoriteBooleans: { type: 'array', items: { type: 'boolean' } },
        favoriteBigint: { type: ['string', 'null'], format: 'bigint' },
        requiredFavoriteBigint: { type: 'string', format: 'bigint' },
        favoriteBigints: { type: ['array', 'null'], items: { type: 'string', format: 'bigint' } },
        requiredFavoriteBigints: { type: 'array', items: { type: 'string', format: 'bigint' } },
        favoriteIntegers: { type: ['array', 'null'], items: { type: 'integer' } },
        requiredFavoriteIntegers: { type: 'array', items: { type: 'integer' } },
        // end: favorite records

        bio: { type: 'string' },
        notes: { type: ['string', 'null'] },
        jsonData: { type: ['object', 'null'], properties: { hello: 'string' } },
        requiredJsonData: { type: 'object', properties: { hello: 'string' } },
        jsonbData: { type: ['object', 'null'], properties: { hello: 'string' } },
        requiredJsonbData: { type: 'object', properties: { hello: 'string' } },
        uuid: { type: 'string' },
        optionalUuid: { type: ['string', 'null'] },

        species: { type: ['string', 'null'], enum: [...SpeciesTypesEnumValues, null] },
        favoriteTreats: {
          type: ['array', 'null'],
          items: { type: 'string', enum: PetTreatsEnumValues },
        },
        collarCount: { type: ['string', 'null'], format: 'bigint' },
        collarCountInt: { type: ['integer', 'null'] },
        collarCountNumeric: { type: ['number', 'null'], format: 'decimal' },
        requiredCollarCount: { type: 'string', format: 'bigint' },
        requiredCollarCountInt: { type: 'integer' },
        likesWalks: { type: ['boolean', 'null'] },
        likesTreats: { type: 'boolean' },
      })
    })

    context('suppressResponseEnums: true', () => {
      it('renders a description with the enums rather than proper enums', () => {
        const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer, {
          suppressResponseEnums: true,
        })
        expect(serializerOpenapiRenderer['renderedOpenapiAttributes']().attributes).toEqual(
          expect.objectContaining({
            species: {
              type: ['string', 'null'],
              description: `The following values will be allowed:
  cat,
  noncat`,
            },
            favoriteTreats: {
              type: ['array', 'null'],
              items: {
                type: 'string',
                description: `The following values will be allowed:
  efishy feesh,
  snick snowcks`,
              },
            },
          }),
        )
      })
    })
  })

  context('with casing specified', () => {
    const MySerializer = (data: User) => DreamSerializer(User, data).attribute('requiredNicknames')

    context('snake casing is specified', () => {
      it('renders all attribute keys in snake case', () => {
        const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer, { casing: 'snake' })
        expect(serializerOpenapiRenderer['renderedOpenapiAttributes']().attributes).toEqual(
          expect.objectContaining({
            required_nicknames: { type: 'array', items: { type: 'string' } },
          }),
        )
      })
    })

    context('camel casing is specified', () => {
      it('renders all attribute keys in camel case', () => {
        const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer, { casing: 'camel' })
        expect(serializerOpenapiRenderer['renderedOpenapiAttributes']().attributes).toEqual(
          expect.objectContaining({
            requiredNicknames: { type: 'array', items: { type: 'string' } },
          }),
        )
      })
    })
  })
})
