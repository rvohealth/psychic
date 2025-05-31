import { OpenapiSchemaBodyShorthand } from '@rvoh/dream'
import allSerializersFromHandWrittenOpenapi from '../../../../src/openapi-renderer/helpers/allSerializersFromHandWrittenOpenapi.js'
import LatexSerializer from '../../../../test-app/src/app/serializers/Balloon/LatexSerializer.js'
import MylarSerializer from '../../../../test-app/src/app/serializers/Balloon/MylarSerializer.js'
import PetSerializer from '../../../../test-app/src/app/serializers/PetSerializer.js'
import UserSerializer from '../../../../test-app/src/app/serializers/UserSerializer.js'

describe('allSerializersFromHandWrittenOpenapi', () => {
  it('extracts all serializer references from an openapi shape', () => {
    const openapi: OpenapiSchemaBodyShorthand = {
      type: 'object',
      properties: {
        myProperty: {
          $serializer: PetSerializer,
        },
        myProperties: {
          type: 'array',
          items: {
            $serializer: LatexSerializer,
          },
        },
        myNullableProperty: {
          anyOf: [
            {
              $serializer: UserSerializer,
            },
            { type: 'null' },
          ],
        },
        myNullableProperties: {
          type: ['array', 'null'],
          items: {
            $serializer: MylarSerializer,
          },
        },
      },
    }

    const results = allSerializersFromHandWrittenOpenapi(openapi)

    expect(results).toHaveLength(4)
    expect(results).toEqual(
      expect.arrayContaining([LatexSerializer, MylarSerializer, PetSerializer, UserSerializer]),
    )
  })
})
