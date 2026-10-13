import { DreamSerializer } from '@rvoh/dream'
import { validateObject } from '../../../../../src/helpers/validateOpenApiSchema.js'
import SerializerOpenapiRenderer from '../../../../../src/openapi-renderer/SerializerOpenapiRenderer.js'
import Balloon from '../../../../../test-app/src/app/models/Balloon.js'
import Pet from '../../../../../test-app/src/app/models/Pet.js'
import User from '../../../../../test-app/src/app/models/User.js'
import {
  BalloonTypesEnum,
  BalloonTypesEnumValues,
  SpeciesTypesEnumValues,
} from '../../../../../test-app/src/types/db.js'

// validates a value against a rendered property schema with the Ajv options Psychic validates with
function validates(schema: unknown, value: unknown) {
  return validateObject(value, schema as object).isValid
}

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
      it('adds null to the type', () => {
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
      it('adds null to the type', () => {
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

    // the test-app reaches its non-nullable enum columns only through User's HasMany
    // associations; the type argument delegates through one as through a HasOne, and
    // the renderer resolves either to the associated model the same way
    context('when the column is a non-nullable enum', () => {
      it('adds null to the type and to the enum', () => {
        const MySerializer = (data: User) =>
          DreamSerializer(User, data).delegatedAttribute<{ pets: Pet }>('pets', 'nonNullSpecies', {
            optional: true,
          })

        const { nonNullSpecies } = new SerializerOpenapiRenderer(MySerializer)['renderedOpenapiAttributes']()
          .attributes
        expect(nonNullSpecies).toEqual({
          type: ['string', 'null'],
          enum: [...SpeciesTypesEnumValues, null],
        })
        expect(validates(nonNullSpecies, null)).toBe(true)
        SpeciesTypesEnumValues.forEach(value => expect(validates(nonNullSpecies, value)).toBe(true))
        expect(validates(nonNullSpecies, 'dog')).toBe(false)
      })
    })

    context('when the column is a non-nullable STI type', () => {
      it('adds null to the type and to the enum', () => {
        // Balloon declares no `type` property, so the type argument adds it
        const MySerializer = (data: User) =>
          DreamSerializer(User, data).delegatedAttribute<{ balloons: Balloon & { type: BalloonTypesEnum } }>(
            'balloons',
            'type',
            { optional: true },
          )

        const { type } = new SerializerOpenapiRenderer(MySerializer)['renderedOpenapiAttributes']().attributes
        expect(type).toEqual({
          type: ['string', 'null'],
          enum: [...BalloonTypesEnumValues, null],
        })
        expect(validates(type, null)).toBe(true)
        BalloonTypesEnumValues.forEach(value => expect(validates(type, value)).toBe(true))
        expect(validates(type, 'BalloonFoil')).toBe(false)
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

    context('when the openapi option is a hand-written enum over a non-nullable column', () => {
      it('adds null to the type and to the enum', () => {
        const MySerializer = (data: Balloon) =>
          DreamSerializer(Balloon, data).delegatedAttribute('user', 'passwordDigest', {
            openapi: { type: 'string', enum: ['hashed', 'unhashed'] },
          })

        const { passwordDigest } = new SerializerOpenapiRenderer(MySerializer)['renderedOpenapiAttributes']()
          .attributes
        expect(passwordDigest).toEqual({
          type: ['string', 'null'],
          enum: ['hashed', 'unhashed', null],
        })
        expect(validates(passwordDigest, null)).toBe(true)
        expect(validates(passwordDigest, 'hashed')).toBe(true)
        expect(validates(passwordDigest, 'unhashed')).toBe(true)
        expect(validates(passwordDigest, 'plain')).toBe(false)
      })
    })

    context('when the openapi option is a hand-written enum over a nullable column', () => {
      it('adds null to the enum without repeating it in the type', () => {
        const MySerializer = (data: Balloon) =>
          DreamSerializer(Balloon, data).delegatedAttribute('user', 'name', {
            openapi: { type: 'string', enum: ['Fred', 'Wilma'] },
          })

        const { name } = new SerializerOpenapiRenderer(MySerializer)['renderedOpenapiAttributes']().attributes
        expect(name).toEqual({
          type: ['string', 'null'],
          enum: ['Fred', 'Wilma', null],
        })
        expect(validates(name, null)).toBe(true)
        expect(validates(name, 'Fred')).toBe(true)
        expect(validates(name, 'Wilma')).toBe(true)
        expect(validates(name, 'Barney')).toBe(false)
      })
    })
  })
})
