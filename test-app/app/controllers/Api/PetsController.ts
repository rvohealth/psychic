import { OpenAPI } from '../../../../src'
import Pet from '../../models/Pet'
import ApplicationController from '../ApplicationController'

export default class ApiPetsController extends ApplicationController {
  @OpenAPI(() => Pet, {
    status: 201,
    requestBody: null,
  })
  public async create() {
    const pet = await Pet.create(this.paramsFor(Pet))
    this.created(pet)
  }

  @OpenAPI(() => Pet, { status: 204, requestBody: null })
  public update() {
    this.noContent()
  }
}
