import { OpenAPI } from '../../../../src/package-exports/index.js'
import Pet from '../models/Pet.js'
import Post from '../models/Post.js'
import User from '../models/User.js'
import ApplicationController from './ApplicationController.js'

export default class PetsController extends ApplicationController {
  @OpenAPI(Pet, {
    fastJsonStringify: true,
    status: 201,
    requestBody: {
      params: [
        'collarCount',
        'collarCountInt',
        'collarCountNumeric',
        'favoriteTreat',
        'favoriteTreats',
        'lastHeardAt',
        'lastSeenAt',
        'likesTreats',
        'likesWalks',
        'name',
        'nonNullFavoriteTreats',
        'nonNullSpecies',
        'requiredCollarCount',
        'requiredCollarCountInt',
        'requiredCollarCountNumeric',
        'species',
      ],
    },
  })
  public async create() {
    const user = await User.findOrFail(this.castParam('userId', 'number'))
    const pet = await Pet.create({ user, ...this.petParams })
    this.created(pet)
  }

  @OpenAPI(Pet, {
    fastJsonStringify: true,
    status: 204,
    requestBody: {
      params: [
        'collarCount',
        'collarCountInt',
        'collarCountNumeric',
        'favoriteTreat',
        'favoriteTreats',
        'lastHeardAt',
        'lastSeenAt',
        'likesTreats',
        'likesWalks',
        'name',
        'nonNullFavoriteTreats',
        'nonNullSpecies',
        'requiredCollarCount',
        'requiredCollarCountInt',
        'requiredCollarCountNumeric',
        'species',
      ],
    },
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
    fastJsonStringify: true,
    status: 204,
    requestBody: {
      params: ['body'],
    },
  })
  public myPosts() {
    this.noContent()
  }
}
