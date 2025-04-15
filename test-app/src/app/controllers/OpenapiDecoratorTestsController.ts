import { PsychicOpenapiNames } from '../../../../src/controller/index.js'
import { OpenAPI } from '../../../../src/index.js'
import {
  Comment1OnlyUsedInOneControllerSerializer,
  Comment2OnlyUsedInOneControllerSerializer,
} from '../serializers/CommentSerializer.js'
import ApplicationController from './ApplicationController.js'

export default class OpenapiDecoratorTestController extends ApplicationController {
  public static override get openapiNames(): PsychicOpenapiNames<ApplicationController> {
    return ['mobile', 'admin']
  }

  @OpenAPI({
    status: 200,
  })
  public testMultipleOpenapiNames() {
    this.ok()
  }

  @OpenAPI({
    status: 200,
    responses: {
      200: {
        type: 'object',
        properties: {
          field1: {
            $serializer: Comment1OnlyUsedInOneControllerSerializer,
          },
          field2: {
            $serializer: Comment2OnlyUsedInOneControllerSerializer,
          },
        },
      },
    },
  })
  public testMultipleSerializers() {
    this.ok()
  }
}
