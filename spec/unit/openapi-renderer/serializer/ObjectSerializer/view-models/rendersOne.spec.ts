/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { ObjectSerializer } from '@rvoh/dream'
import SerializerOpenapiRenderer from '../../../../../../src/openapi-renderer/SerializerOpenapiRenderer.js'
import MyViewModelSerializer from '../../../../../../test-app/src/app/serializers/ViewModels/MyViewModelSerializer.js'
import MyViewModel from '../../../../../../test-app/src/app/view-models/MyViewModel.js'

describe('ObjectSerializer (on a view model) rendersOne', () => {
  it('renders the ViewModel’s default serializer and includes the referenced serializer in the returned referencedSerializers array', () => {
    const MySerializer = (data: MyViewModel) =>
      ObjectSerializer(data).rendersOne('myHasOne', { viewModelClass: MyViewModel })

    const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer)
    const results = serializerOpenapiRenderer['renderedOpenapiAttributes']()
    expect(results.attributes).toEqual({
      myHasOne: {
        $ref: '#/components/schemas/ViewModelsMyViewModel',
      },
    })

    expect(results.referencedSerializers).toEqual([MyViewModelSerializer])
  })

  it('supports specifying a specific serializerKey', () => {
    const MySerializer = (data: MyViewModel) =>
      ObjectSerializer(data).rendersOne('myHasOne', {
        viewModelClass: MyViewModel,
        serializerKey: 'somethingElse',
      })

    const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer)
    expect(serializerOpenapiRenderer['renderedOpenapiAttributes']().attributes).toEqual({
      myHasOne: {
        $ref: '#/components/schemas/MyViewModelSummary',
      },
    })
  })

  it("supports customizing the name of the thing rendered via { as: '...' } (replaces `source: string`)", () => {
    const MySerializer = (data: MyViewModel) =>
      ObjectSerializer(data).rendersOne('myHasOne', {
        viewModelClass: MyViewModel,
        as: 'myHasOne2',
      })

    const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer)
    expect(serializerOpenapiRenderer['renderedOpenapiAttributes']().attributes).toEqual({
      myHasOne2: {
        $ref: '#/components/schemas/ViewModelsMyViewModel',
      },
    })
  })

  context('flatten', () => {
    it('renders the serialized data into this model and adjusts the OpenAPI spec accordingly', () => {
      const MySerializer = (data: MyViewModel) =>
        ObjectSerializer(data)
          .attribute('name', { openapi: 'string' })
          .rendersOne('myHasOne', { viewModelClass: MyViewModel, flatten: true })

      const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer)
      expect(serializerOpenapiRenderer.renderedOpenapi().openapi).toEqual({
        allOf: [
          {
            type: 'object',
            required: ['name'],
            properties: {
              name: { type: 'string' },
            },
          },
          {
            $ref: '#/components/schemas/ViewModelsMyViewModel',
          },
        ],
      })
    })
  })

  it('supports supplying a custom serializer', () => {
    const CustomSerializer = (data: MyViewModel) =>
      ObjectSerializer(data).attribute('name', { openapi: 'string' })
    ;(CustomSerializer as any).globalName = 'CustomUserSerializer'
    ;(CustomSerializer as any).openapiName = 'CustomUser'
    const MySerializer = (data: MyViewModel) =>
      ObjectSerializer(data).rendersOne('myHasOne', {
        serializer: CustomSerializer,
      })

    const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer)
    expect(serializerOpenapiRenderer['renderedOpenapiAttributes']().attributes).toEqual({
      myHasOne: {
        $ref: '#/components/schemas/CustomUser',
      },
    })
  })
})
