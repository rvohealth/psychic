/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { CalendarDate, DreamSerializer, ObjectSerializer } from '@rvoh/dream'
import SerializerOpenapiRenderer from '../../../../../src/openapi-renderer/SerializerOpenapiRenderer.js'
import { default as DreamUser } from '../../../../../test-app/src/app/models/User.js'
import { SpeciesTypesEnum, SpeciesTypesEnumValues } from '../../../../../test-app/src/types/db.js'

interface SimpleUser {
  id: string
  name?: string
  birthdate?: CalendarDate
}

interface PetWithDreamUser {
  id: string
  name?: string
  user?: DreamUser
  species?: SpeciesTypesEnum
}

interface PetWithSimpleUser {
  id: string
  name?: string
  user?: SimpleUser
  species?: SpeciesTypesEnum
}

describe('ObjectSerializer rendersOne', () => {
  context('simple objects', () => {
    it('renders the associated objects using the provided serializer callback', () => {
      const UserSerializer = (data: SimpleUser) =>
        ObjectSerializer(data).attribute('name', { openapi: ['string', 'null'] })
      ;(UserSerializer as any).globalName = 'CustomUserSerializer'
      ;(UserSerializer as any).openapiName = 'CustomUser'
      const MySerializer = (data: PetWithSimpleUser) =>
        ObjectSerializer(data).rendersOne('user', { serializer: UserSerializer })

      const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer)
      const results = serializerOpenapiRenderer['renderedOpenapiAttributes']()
      expect(results.attributes).toEqual({
        user: {
          $ref: '#/components/schemas/CustomUser',
        },
      })

      expect(results.referencedSerializers).toEqual([UserSerializer])
    })
  })

  context('Dream model', () => {
    it('renders the Dream model’s default serializer', () => {
      const MySerializer = (data: PetWithDreamUser) =>
        ObjectSerializer(data).rendersOne('user', { dreamClass: DreamUser })

      const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer)
      expect(serializerOpenapiRenderer['renderedOpenapiAttributes']().attributes).toEqual({
        user: {
          $ref: '#/components/schemas/User',
        },
      })
    })

    it('supports specifying a specific serializerKey', () => {
      const MySerializer = (data: PetWithDreamUser) =>
        ObjectSerializer(data).rendersOne('user', { dreamClass: DreamUser, serializerKey: 'summary' })

      const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer)
      expect(serializerOpenapiRenderer['renderedOpenapiAttributes']().attributes).toEqual({
        user: {
          $ref: '#/components/schemas/UserSummary',
        },
      })
    })

    it('supports supplying a custom serializer', () => {
      const CustomSerializer = (data: DreamUser) => DreamSerializer(DreamUser, data).attribute('name')
      ;(CustomSerializer as any).globalName = 'CustomUserSerializer'
      ;(CustomSerializer as any).openapiName = 'CustomUser'
      const MySerializer = (data: PetWithDreamUser) =>
        ObjectSerializer(data).rendersOne('user', { serializer: CustomSerializer })

      const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer)
      expect(serializerOpenapiRenderer['renderedOpenapiAttributes']().attributes).toEqual({
        user: {
          $ref: '#/components/schemas/CustomUser',
        },
      })
    })

    it("supports customizing the name of the thing rendered via { as: '...' } (replaces `source: string`)", () => {
      const MySerializer = (data: PetWithDreamUser) =>
        ObjectSerializer(data).rendersOne('user', { dreamClass: DreamUser, as: 'user2' })

      const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer)
      expect(serializerOpenapiRenderer['renderedOpenapiAttributes']().attributes).toEqual({
        user2: {
          $ref: '#/components/schemas/User',
        },
      })
    })

    context('flatten', () => {
      it('renders the serialized data into this model and adjusts the OpenAPI spec accordingly', () => {
        const MySerializer = (data: PetWithDreamUser) =>
          ObjectSerializer(data)
            .attribute('species', { openapi: { type: ['string', 'null'], enum: SpeciesTypesEnumValues } })
            .rendersOne('user', { dreamClass: DreamUser, flatten: true })

        const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer)
        expect(serializerOpenapiRenderer.renderedOpenapi().openapi).toEqual({
          allOf: [
            {
              type: 'object',
              required: ['species'],
              properties: {
                species: { type: ['string', 'null'], enum: SpeciesTypesEnumValues },
              },
            },
            {
              $ref: '#/components/schemas/User',
            },
          ],
        })
      })
    })
  })
})
