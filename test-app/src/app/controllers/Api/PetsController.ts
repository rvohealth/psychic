import { OpenAPI } from '../../../../../src.js'
import Pet from '../../models/Pet.js'
import ApplicationController from '../ApplicationController.js'

export default class ApiPetsController extends ApplicationController {
  @OpenAPI(Pet, {
    status: 201,
    requestBody: null,
  })
  public async create() {
    const pet = await Pet.create(this.paramsFor(Pet))
    this.created(pet)
  }

  @OpenAPI(Pet, { status: 204, requestBody: null })
  public update() {
    this.noContent()
  }
}
