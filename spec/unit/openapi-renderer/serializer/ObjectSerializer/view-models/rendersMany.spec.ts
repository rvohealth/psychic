/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { ObjectSerializer } from '@rvoh/dream'
import SerializerOpenapiRenderer from '../../../../../../src/openapi-renderer/SerializerOpenapiRenderer.js'
import Balloon from '../../../../../../test-app/src/app/models/Balloon.js'
import MyViewModelSerializer, {
  MyViewModelSummarySerializer,
} from '../../../../../../test-app/src/app/serializers/ViewModels/MyViewModelSerializer.js'
import MyViewModel from '../../../../../../test-app/src/app/view-models/MyViewModel.js'

describe('ObjectSerializer (on a view model) rendersMany', () => {
  it('renders the associated objects', () => {
    const MySerializer = (data: MyViewModel) =>
      ObjectSerializer(data).rendersMany('myHasMany', {
        viewModelClass: MyViewModel,
      })

    const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer)
    const results = serializerOpenapiRenderer['renderedOpenapiAttributes']()
    expect(results.attributes).toEqual({
      myHasMany: {
        type: 'array',
        items: {
          $ref: '#/components/schemas/ViewModelsMyViewModel',
        },
      },
    })

    expect(results.referencedSerializers).toEqual([MyViewModelSerializer])
  })

  it('expands STI base model into OpenAPI for all of the child types', () => {
    const MySerializer = (data: MyViewModel) =>
      ObjectSerializer(data).rendersMany('balloons', { dreamClass: Balloon })

    const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer)
    expect(serializerOpenapiRenderer['renderedOpenapiAttributes']().attributes).toEqual({
      balloons: {
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
    })
  })

  it('supports specifying the serializerKey', () => {
    const MySerializer = (data: MyViewModel) =>
      ObjectSerializer(data).rendersMany('myHasMany', {
        viewModelClass: MyViewModel,
        serializerKey: 'somethingElse',
      })

    const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer)
    const results = serializerOpenapiRenderer['renderedOpenapiAttributes']()
    expect(results.attributes).toEqual({
      myHasMany: {
        type: 'array',
        items: {
          $ref: '#/components/schemas/MyViewModelSummary',
        },
      },
    })

    expect(results.referencedSerializers).toEqual([MyViewModelSummarySerializer])
  })

  it("supports customizing the name of the thing rendered via { as: '...' } (replaces `source: string`)", () => {
    const MySerializer = (data: MyViewModel) =>
      ObjectSerializer(data).rendersMany('myHasMany', {
        viewModelClass: MyViewModel,
        as: 'pets2',
      })

    const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer)
    expect(serializerOpenapiRenderer['renderedOpenapiAttributes']().attributes).toEqual({
      pets2: {
        type: 'array',
        items: {
          $ref: '#/components/schemas/ViewModelsMyViewModel',
        },
      },
    })
  })

  it('supports supplying a custom serializer', () => {
    const CustomSerializer = (data: MyViewModel) =>
      ObjectSerializer(data).attribute('name', { openapi: 'string' })
    ;(CustomSerializer as any).globalName = 'CustomPetSerializer'
    ;(CustomSerializer as any).openapiName = 'CustomPet'
    const MySerializer = (data: MyViewModel) =>
      ObjectSerializer(data).rendersMany('myHasMany', {
        serializer: CustomSerializer,
      })

    const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer)
    expect(serializerOpenapiRenderer['renderedOpenapiAttributes']().attributes).toEqual({
      myHasMany: {
        type: 'array',
        items: {
          $ref: '#/components/schemas/CustomPet',
        },
      },
    })
  })
})
