import EnvInternal from '../../../../src/helpers/EnvInternal.js'
import { OpenAPI } from '../../../../src/index.js'
import ModelWithoutSerializer from '../models/ModelWithoutSerializer.js'
import ApplicationController from './ApplicationController.js'

export default class OpenapiValidationTestsController extends ApplicationController {
  @OpenAPI({
    status: 200,
    requestBody: {
      type: 'object',
      properties: {
        numericParam: 'number',
      },
    },
  })
  public invalidRequestBody() {
    this.ok()
  }

  @OpenAPI({
    status: 204,
    requestBody: {
      type: 'object',
      required: ['requiredInt'],
      properties: {
        requiredInt: 'integer',
        optionalInt: 'integer',
      },
    },
  })
  public requestBodyOpenapiTest() {
    this.noContent()
  }

  @OpenAPI({
    status: 200,
    requestBody: {
      type: 'object',
      required: ['nested'],
      properties: {
        nested: {
          type: 'object',
          required: ['object'],
          properties: {
            object: {
              type: 'object',
              required: ['requiredInt'],
              properties: {
                requiredInt: 'integer',
                optionalInt: 'integer',
              },
            },
          },
        },
      },
    },
  })
  public requestBodyNestedObjectOpenapiTest() {
    this.noContent()
  }

  @OpenAPI({
    status: 204,
    requestBody: {
      $ref: '#/components/schemas/CustomSchemaObject',
    },
  })
  public requestBodyboilerplateSchemaTest() {
    this.noContent()
  }

  @OpenAPI({
    status: 200,
    query: {
      stringParam: {
        required: false,
        schema: {
          type: 'string',
        },
      },
      numericParam: {
        required: false,
        schema: {
          type: 'number',
        },
      },
      stringArray: {
        required: false,
        schema: {
          type: 'string[]',
        },
      },
      'otherStringArray[]': {
        required: false,
        schema: {
          type: ['array', 'null'],
          items: {
            type: 'string',
          },
        },
      },
    },
  })
  public queryOpenapiTest() {
    this.ok({
      stringParam: this.params.stringParam,
      numericParam: this.params.numericParam,
      stringArray: this.params.stringArray,
      'otherStringArray[]': this.params['otherStringArray[]'],
    })
  }

  @OpenAPI({
    status: 200,
    query: {
      stringArray: {
        required: true,
        schema: {
          type: ['array', 'null'],
          items: {
            type: 'string',
          },
        },
      },
    },
  })
  public queryRequiredValueTest() {
    this.ok({ stringArray: this.params.stringArray })
  }

  @OpenAPI({
    status: 200,
    query: {
      requiredStringParam: {
        required: true,
        schema: {
          type: 'string',
        },
      },
      nonRequiredStringParam: {
        required: false,
        schema: {
          type: 'string',
        },
      },
    },
    validate: {
      ajvOptions: {
        allErrors: EnvInternal.isTest,
      },
    },
  })
  public queryRequiredOpenapiTest() {
    this.ok()
  }

  @OpenAPI({
    status: 200,
    responses: {
      200: {
        type: 'number',
      },
    },
  })
  public responseBodyOpenapiTest() {
    this.ok(this.params.renderMe && Number(this.params.renderMe))
  }

  @OpenAPI({
    status: 200,
    responses: {
      200: {
        type: 'object',
        required: ['nested'],
        properties: {
          nested: {
            type: 'object',
            required: ['object'],
            properties: {
              object: {
                type: 'object',
                required: ['requiredInt'],
                properties: {
                  requiredInt: 'integer',
                  optionalInt: 'integer',
                },
              },
            },
          },
        },
      },
    },
  })
  public responseBodyNestedObjectOpenapiTest() {
    this.ok({
      nested: {
        object: {
          requiredInt: this.params.requiredInt,
          optionalInt: this.params.optionalInt,
        },
      },
    })
  }

  @OpenAPI({
    status: 200,
    responses: {
      200: {
        type: 'object',
        required: ['requiredInt'],
        properties: {
          requiredInt: 'integer',
          optionalInt: 'integer',
        },
      },
    },
  })
  public responseBodyObjectOpenapiTest() {
    this.ok({
      requiredInt: this.params.requiredInt && parseInt(this.params.requiredInt as string),
      optionalInt: this.params.optionalInt,
    })
  }

  @OpenAPI({
    status: 200,
    responses: {
      200: {
        $schema: 'CustomSchemaObject',
      },
    },
  })
  public responseBodyboilerplateSchemaTest() {
    this.ok({ myField: 'hello world' })
  }

  @OpenAPI({
    status: 200,
    headers: {
      myDate: {
        required: true,
        format: 'date',
      },
      myOptionalDate: {
        required: false,
        format: 'date',
      },
      myOptionalInt: {
        required: false,
        schema: {
          type: 'integer',
        },
      },
    },
    validate: {
      ajvOptions: {
        allErrors: EnvInternal.isTest,
      },
    },
  })
  public headersOpenapiTest() {
    this.ok({
      myDate: this.req.headers.mydate,
      myOptionalDate: this.req.headers.myoptionaldate,
      myOptionalInt: this.req.headers.myoptionalint,
    })
  }

  @OpenAPI({
    status: 200,
    responses: {
      200: {
        type: 'number',
      },
      401: {
        type: 'number',
      },
    },
  })
  public responseAlternateStatusTest() {
    this.unauthorized(12345)
  }

  @OpenAPI(ModelWithoutSerializer, {
    status: 204,
  })
  public dontThrowMissingSerializersDefinition() {
    this.noContent()
  }
}
