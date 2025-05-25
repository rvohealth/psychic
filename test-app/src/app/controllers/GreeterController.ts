import { OpenAPI } from '../../../../src/index.js'
import { CommentWithAnyOfArraySerializer } from '../serializers/CommentSerializer.js'
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
        $serializer: CommentWithAnyOfArraySerializer,
      },
    },
  })
  public justforspecs() {}
}
