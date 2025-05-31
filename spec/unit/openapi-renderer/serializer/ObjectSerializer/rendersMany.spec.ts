/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { CalendarDate, ObjectSerializer } from '@rvoh/dream'
import SerializerOpenapiRenderer from '../../../../../src/openapi-renderer/SerializerOpenapiRenderer.js'
import { default as DreamPet } from '../../../../../test-app/src/app/models/Pet.js'
import { PetTreatsEnum, SpeciesTypesEnum } from '../../../../../test-app/src/types/db.js'

interface UserWithSimplePets {
  id: string
  name?: string
  birthdate?: CalendarDate
  pets: SimplePet[]
}

interface UserWithDreamPets {
  id: string
  name?: string
  birthdate?: CalendarDate
  pets: DreamPet[]
}

interface SimplePet {
  id: string
  name?: string
  species?: SpeciesTypesEnum
  ratings?: any[]
  favoriteTreats?: PetTreatsEnum[]
}

describe('ObjectSerializer rendersMany', () => {
  context('simple objects', () => {
    it('renders the associated objects using the provided serializer callback', () => {
      const PetSerializer = (data: SimplePet) =>
        ObjectSerializer(data).attribute('name', { openapi: ['string', 'null'] })
      ;(PetSerializer as any).globalName = 'PetSerializer'
      ;(PetSerializer as any).openapiName = 'Pet'
      const MySerializer = (data: UserWithSimplePets) =>
        ObjectSerializer(data).rendersMany('pets', { serializer: PetSerializer })

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

      expect(results.referencedSerializers).toEqual([PetSerializer])
    })
  })

  context('Dream models', () => {
    it('renders the associated objects using the default serializer for the Dream model', () => {
      const MySerializer = (data: UserWithDreamPets) =>
        ObjectSerializer(data).rendersMany('pets', { dreamClass: DreamPet })

      const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer)
      expect(serializerOpenapiRenderer['renderedOpenapiAttributes']().attributes).toEqual({
        pets: {
          type: 'array',
          items: {
            $ref: '#/components/schemas/Pet',
          },
        },
      })
    })

    it('supports rendering a Dream model with a custom serializerKey', () => {
      const MySerializer = (data: UserWithDreamPets) =>
        ObjectSerializer(data).rendersMany('pets', { dreamClass: DreamPet, serializerKey: 'summary' })

      const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer)
      expect(serializerOpenapiRenderer['renderedOpenapiAttributes']().attributes).toEqual({
        pets: {
          type: 'array',
          items: {
            $ref: '#/components/schemas/PetSummary',
          },
        },
      })
    })

    it("supports customizing the name of the thing rendered via { as: '...' } (replaces `source: string`)", () => {
      const MySerializer = (data: UserWithDreamPets) =>
        ObjectSerializer(data).rendersMany('pets', { dreamClass: DreamPet, as: 'pets2' })

      const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer)
      expect(serializerOpenapiRenderer['renderedOpenapiAttributes']().attributes).toEqual({
        pets2: {
          type: 'array',
          items: {
            $ref: '#/components/schemas/Pet',
          },
        },
      })
    })

    it('supports supplying a custom serializer', () => {
      const CustomSerializer = (data: SimplePet) =>
        ObjectSerializer(data).attribute('name', { openapi: ['string', 'null'] })
      ;(CustomSerializer as any).globalName = 'CustomPetSerializer'
      ;(CustomSerializer as any).openapiName = 'CustomPet'
      const MySerializer = (data: UserWithSimplePets) =>
        ObjectSerializer(data).rendersMany('pets', { serializer: CustomSerializer })

      const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer)
      expect(serializerOpenapiRenderer['renderedOpenapiAttributes']().attributes).toEqual({
        pets: {
          type: 'array',
          items: {
            $ref: '#/components/schemas/CustomPet',
          },
        },
      })
    })
  })
})
