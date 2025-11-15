import { OpenAPI } from '../../../../src/package-exports/index.js'
import Pet from '../models/Pet.js'
import Post from '../models/Post.js'
import User from '../models/User.js'
import ApplicationController from './ApplicationController.js'

export default class PetsController extends ApplicationController {
  @OpenAPI(Pet, {
    status: 201,
  })
  public async create() {
    const user = await User.findOrFail(this.castParam('userId', 'number'))
    const pet = await Pet.create({ user, ...this.petParams })
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
