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
