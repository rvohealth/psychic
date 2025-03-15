import { OpenAPI } from '../../../../src.js'
import { HelloSerializer } from '../serializers/Circular/HelloSerializer.js'
import ApplicationController from './ApplicationController.js'

export default class CircularController extends ApplicationController {
  @OpenAPI(HelloSerializer, { status: 200 })
  public hello() {
    this.ok()
  }
}
