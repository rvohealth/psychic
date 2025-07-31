import { OpenAPI } from '../../../../src/index.js'
import Pet from '../models/Pet.js'
import Post from '../models/Post.js'
import ApplicationController from './ApplicationController.js'

export default class PetsController extends ApplicationController {
  @OpenAPI(Pet, {
    status: 201,
  })
  public async create() {
    const pet = await Pet.create(this.petParams)
    this.created(pet)
  }

  @OpenAPI(Pet, {
    status: 204,
  })
  public async update() {
    const pet = await Pet.findOrFail(this.castParam('id', 'bigint'))
    await pet.update(this.paramsFor(Pet))
    this.noContent()
  }

  @OpenAPI({
    status: 200,
    requestBody: {
      type: 'object',
      properties: {
        numericParam: 'number',
      },
    },
    responses: {
      200: {
        type: 'string',
      },
    },
  })
  public invalidRequestBody() {
    this.ok('hi')
  }

  @OpenAPI(Pet, {
    status: 200,
    query: {
      stringParam: {
        required: false,
        schema: {
          type: 'string',
        },
      },
      numericParam: {
        required: false,
        schema: {
          type: 'number',
        },
      },
      stringArray: {
        required: false,
        schema: {
          type: 'string[]',
        },
      },
    },
  })
  public queryOpenapiTest() {
    this.ok()
  }

  @OpenAPI({
    status: 200,
    responses: {
      200: {
        type: 'number',
      },
    },
  })
  public responseBodyOpenapiTest() {
    this.ok(this.params.renderMe)
  }

  @OpenAPI({
    status: 200,
    responses: {
      200: {
        type: 'number',
      },
      401: {
        type: 'number',
      },
    },
  })
  public responseAlternateStatusTest() {
    this.unauthorized(12345)
  }

  public update2() {
    this.noContent()
  }

  public hello() {
    this.noContent()
  }

  private get petParams() {
    return this.paramsFor(Pet, { including: ['userId'] })
  }

  @OpenAPI(Post, {
    status: 204,
  })
  public myPosts() {
    this.noContent()
  }
}
