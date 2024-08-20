import { OpenAPI } from '../../../src/controller/decorators'
import { HelloSerializer } from '../serializers/Circular/HelloSerializer'
import ApplicationController from './ApplicationController'

export default class CircularController extends ApplicationController {
  @OpenAPI(HelloSerializer, { status: 200 })
  public hello() {
    this.ok()
  }
}
