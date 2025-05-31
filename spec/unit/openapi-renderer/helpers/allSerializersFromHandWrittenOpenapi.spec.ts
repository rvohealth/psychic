import { OpenapiSchemaBodyShorthand } from '@rvoh/dream'
import allSerializersFromHandWrittenOpenapi from '../../../../src/openapi-renderer/helpers/allSerializersFromHandWrittenOpenapi.js'
import Balloon from '../../../../test-app/src/app/models/Balloon.js'
import BalloonLatex from '../../../../test-app/src/app/models/Balloon/Latex.js'
import BalloonMylar from '../../../../test-app/src/app/models/Balloon/Mylar.js'
import Pet from '../../../../test-app/src/app/models/Pet.js'
import LatexSerializer, {
  LatexSummarySerializer,
} from '../../../../test-app/src/app/serializers/Balloon/LatexSerializer.js'
import MylarSerializer, {
  MylarSummarySerializer,
} from '../../../../test-app/src/app/serializers/Balloon/MylarSerializer.js'
import PetSerializer, {
  PetWithAssociationSerializer,
} from '../../../../test-app/src/app/serializers/PetSerializer.js'
import UserSerializer from '../../../../test-app/src/app/serializers/UserSerializer.js'
import MyViewModelSerializer from '../../../../test-app/src/app/serializers/ViewModels/MyViewModelSerializer.js'
import MyViewModel from '../../../../test-app/src/app/view-models/MyViewModel.js'

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

  it('extracts all $serializable references from an openapi shape as serializers', () => {
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

    const results = allSerializersFromHandWrittenOpenapi(openapi)

    expect(results).toHaveLength(4)
    expect(results).toEqual(
      expect.arrayContaining([LatexSerializer, MylarSerializer, MyViewModelSerializer, PetSerializer]),
    )
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

      const results = allSerializersFromHandWrittenOpenapi(openapi)

      expect(results).toHaveLength(2)
      expect(results).toEqual(expect.arrayContaining([LatexSerializer, MylarSerializer]))
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

      const results = allSerializersFromHandWrittenOpenapi(openapi)

      expect(results).toHaveLength(3)
      expect(results).toEqual(
        expect.arrayContaining([
          LatexSummarySerializer,
          MylarSummarySerializer,
          PetWithAssociationSerializer,
        ]),
      )
    })
  })
})
