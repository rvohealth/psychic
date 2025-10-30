import { OpenAPI } from '../../../../src/package-exports/index.js'
import Balloon from '../models/Balloon.js'
import Pet from '../models/Pet.js'
import MyViewModel from '../view-models/MyViewModel.js'
import ApplicationController from './ApplicationController.js'

export default class BalloonsController extends ApplicationController {
  @OpenAPI(Balloon, {
    status: 200,
    many: true,
  })
  public async index() {
    const balloons = await Balloon.all()
    this.ok(balloons)
  }

  @OpenAPI(Balloon, {
    status: 200,
    paginate: true,
  })
  public async paginated() {
    const balloons = await Balloon.paginate({ page: 1 })
    this.ok(balloons)
  }

  @OpenAPI(Balloon, {
    status: 200,
    scrollPaginate: true,
  })
  public async scrollPaginated() {
    const balloons = await Balloon.scrollPaginate({ cursor: null })
    this.ok(balloons)
  }

  @OpenAPI([Balloon, Pet], {
    status: 200,
    many: true,
  })
  public async indexDifferentDreams() {
    const balloon = await Balloon.all()
    this.ok(balloon)
  }

  @OpenAPI([Balloon, Pet, MyViewModel], {
    status: 200,
    many: true,
    serializerKey: 'default',
  })
  public async indexDreamsAndViewModel() {
    const balloon = await Balloon.all()
    this.ok(balloon)
  }

  @OpenAPI(Balloon, {
    status: 200,
  })
  public async show() {
    const balloon = await Balloon.findOrFail(this.castParam('id', 'bigint'))
    this.ok(balloon)
  }
}
