import { OpenAPI } from '../../../../src.js'
import { CommentTestingBasicSerializerRefSerializer } from '../serializers/CommentSerializer.js'
import ApplicationController from './ApplicationController.js'

export default class GreeterController extends ApplicationController {
  public show() {
    this.ok('must go on')
  }

  public hello() {
    this.ok('goodbye')
  }

  @OpenAPI({
    status: 200,
    responses: {
      200: {
        $serializer: CommentTestingBasicSerializerRefSerializer,
      },
    },
  })
  public justforspecs() {}
}
