import { ObjectSerializer } from '@rvoh/dream'
import SerializerOpenapiRenderer from '../../../../../../src/openapi-renderer/SerializerOpenapiRenderer.js'
import MyViewModelSerializer from '../../../../../../test-app/src/app/serializers/ViewModels/MyViewModelSerializer.js'
import MyViewModel from '../../../../../../test-app/src/app/view-models/MyViewModel.js'

describe('ObjectSerializer (on a view model) customAttribute', () => {
  it('renders the ViewModel’s default serializer and includes the referenced serializer in the returned referencedSerializers array', () => {
    const MySerializer = (data: MyViewModel) =>
      ObjectSerializer(data).customAttribute('myHasOne', () => null, {
        openapi: { $serializable: MyViewModel },
      })

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
      ObjectSerializer(data).customAttribute('myHasOne', () => null, {
        openapi: { $serializable: MyViewModel, $serializableSerializerKey: 'somethingElse' },
      })

    const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer)
    expect(serializerOpenapiRenderer['renderedOpenapiAttributes']().attributes).toEqual({
      myHasOne: {
        $ref: '#/components/schemas/MyViewModelSummary',
      },
    })
  })

  context('flatten', () => {
    it('renders the serialized data into this model and adjusts the OpenAPI spec accordingly', () => {
      const MySerializer = (data: MyViewModel) =>
        ObjectSerializer(data)
          .attribute('name', { openapi: 'string' })
          .customAttribute('myHasOne', () => null, { openapi: { $serializable: MyViewModel }, flatten: true })

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
})
