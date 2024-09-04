import { OpenAPI } from '../../../../src'
import { CommentTestingBasicSerializerRefSerializer } from '../serializers/CommentSerializer'
import ApplicationController from './ApplicationController'

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
