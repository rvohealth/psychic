import { OpenapiSchemaBodyShorthand } from '@rvoh/dream'
import allSerializersToRefsInOpenapi from '../../../../src/openapi-renderer/helpers/allSerializersToRefsInOpenapi.js'
import Balloon from '../../../../test-app/src/app/models/Balloon.js'
import BalloonLatex from '../../../../test-app/src/app/models/Balloon/Latex.js'
import BalloonMylar from '../../../../test-app/src/app/models/Balloon/Mylar.js'
import Pet from '../../../../test-app/src/app/models/Pet.js'
import LatexSerializer from '../../../../test-app/src/app/serializers/Balloon/LatexSerializer.js'
import MylarSerializer from '../../../../test-app/src/app/serializers/Balloon/MylarSerializer.js'
import PetSerializer, {
  PetSummarySerializer,
} from '../../../../test-app/src/app/serializers/PetSerializer.js'
import MyViewModel from '../../../../test-app/src/app/view-models/MyViewModel.js'

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

  it('converts all $serializable references from an openapi shape as serializers', () => {
    const openapi: OpenapiSchemaBodyShorthand = {
      type: 'object',
      properties: {
        myProperty: {
          $serializable: Pet,
        },
        myProperties: {
          type: 'array',
          items: {
            $serializable: BalloonLatex,
          },
        },
        myNullableProperty: {
          anyOf: [
            {
              $serializable: MyViewModel,
            },
            { type: 'null' },
          ],
        },
        myNullableProperties: {
          type: ['array', 'null'],
          items: {
            $serializable: BalloonMylar,
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
              $ref: '#/components/schemas/ViewModelsMyViewModel',
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

  context('STI base models', () => {
    it('are extracted into serializers for all STI children', () => {
      const openapi: OpenapiSchemaBodyShorthand = {
        type: 'object',
        properties: {
          myProperties: {
            type: 'array',
            items: {
              $serializable: Balloon,
            },
          },
        },
      }

      const results = allSerializersToRefsInOpenapi(openapi)

      expect(results).toEqual({
        type: 'object',
        properties: {
          myProperties: {
            type: 'array',
            items: {
              anyOf: [
                {
                  $ref: '#/components/schemas/BalloonLatex',
                },
                {
                  $ref: '#/components/schemas/BalloonMylar',
                },
              ],
            },
          },
        },
      })
    })
  })

  context('when serializerKey is specified', () => {
    it('extracts serializers corresponding to the specified serializer key', () => {
      const openapi: OpenapiSchemaBodyShorthand = {
        type: 'object',
        properties: {
          myProperty: {
            $serializable: Pet,
            $serializableSerializerKey: 'withAssociation',
          },
          myProperties: {
            type: 'array',
            items: {
              $serializable: Balloon,
              $serializableSerializerKey: 'summary',
            },
          },
        },
      }

      const results = allSerializersToRefsInOpenapi(openapi)

      expect(results).toEqual({
        type: 'object',
        properties: {
          myProperty: {
            $ref: '#/components/schemas/PetWithAssociation',
          },
          myProperties: {
            type: 'array',
            items: {
              anyOf: [
                {
                  $ref: '#/components/schemas/LatexSummary',
                },
                {
                  $ref: '#/components/schemas/MylarSummary',
                },
              ],
            },
          },
        },
      })
    })
  })
})
