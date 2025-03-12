import { OpenAPI } from '../../../../src'
import Pet from '../models/Pet'
import Post from '../models/Post'
import ApplicationController from './ApplicationController'

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
    return this.paramsFor(Pet)
  }

  @OpenAPI(Post, {
    status: 204,
  })
  public myPosts() {
    this.noContent()
  }
}
