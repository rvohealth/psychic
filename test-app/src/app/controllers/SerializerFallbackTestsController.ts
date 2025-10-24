import { OpenAPI } from '../../../../src/package-exports/index.js'
import Pet from '../models/Pet.js'
import PetSerializer from '../serializers/PetSerializer.js'
import ApplicationController from './ApplicationController.js'

export default class SerializerFallbackTestsController extends ApplicationController {
  @OpenAPI(PetSerializer, {
    status: 200,
  })
  public async usesOpenapiSerializer() {
    this.ok(await Pet.firstOrFail())
  }

  @OpenAPI(Pet, {
    status: 200,
    serializerKey: 'additional',
  })
  public async usesOpenapiSerializerWithSerializerKey() {
    this.ok(await Pet.firstOrFail())
  }

  @OpenAPI(PetSerializer, {
    status: 200,
  })
  public async doesntUseOpenapiSerializer() {
    this.ok(PetSerializer(await Pet.firstOrFail()).render())
  }

  @OpenAPI(PetSerializer, {
    status: 200,
    validate: {
      // intentionally mis-matching the serializer here
      // with the provided serializerKey, to ensure that
      // psychic will always consider the serializer key
      // when rendering. Because of that, we need to turn
      // validation off, lest the openapi validator get
      // confused about the mismatch and declare our rendered
      // shape invalid
      all: false,
    },
  })
  public async overridesOpenapiSerializer() {
    this.ok(await Pet.firstOrFail(), { serializerKey: 'additional' })
  }
}
