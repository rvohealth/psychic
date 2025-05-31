import { OpenapiSchemaBodyShorthand } from '@rvoh/dream'
import allSerializersToRefsInOpenapi from '../../../../src/openapi-renderer/helpers/allSerializersToRefsInOpenapi.js'
import LatexSerializer from '../../../../test-app/src/app/serializers/Balloon/LatexSerializer.js'
import MylarSerializer from '../../../../test-app/src/app/serializers/Balloon/MylarSerializer.js'
import PetSerializer, {
  PetSummarySerializer,
} from '../../../../test-app/src/app/serializers/PetSerializer.js'

describe('allSerializersToRefsInOpenapi', () => {
  it('converts $serializer to $ref', () => {
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
              $serializer: PetSummarySerializer,
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

    const results = allSerializersToRefsInOpenapi(openapi)

    expect(results).toEqual({
      type: 'object',
      properties: {
        myProperty: {
          $ref: '#/components/schemas/Pet',
        },
        myProperties: {
          type: 'array',
          items: {
            $ref: '#/components/schemas/BalloonLatex',
          },
        },
        myNullableProperty: {
          anyOf: [
            {
              $ref: '#/components/schemas/PetSummary',
            },
            { type: 'null' },
          ],
        },
        myNullableProperties: {
          type: ['array', 'null'],
          items: {
            $ref: '#/components/schemas/BalloonMylar',
          },
        },
      },
    })
  })
})
