import { OpenapiSchemaBody } from '@rvoh/dream/openapi'
import { OpenapiContent, OpenapiResponses, OpenapiValidateTargets } from './endpoint.js'

export const DEFAULT_OPENAPI_RESPONSES = {
  400: {
    $ref: '#/components/responses/BadRequest',
  },
  401: {
    $ref: '#/components/responses/Unauthorized',
  },
  403: {
    $ref: '#/components/responses/Forbidden',
  },
  404: {
    $ref: '#/components/responses/NotFound',
  },
  409: {
    $ref: '#/components/responses/Conflict',
  },
  422: {
    $ref: '#/components/responses/ValidationErrors',
  },
  500: {
    $ref: '#/components/responses/InternalServerError',
  },
} as OpenapiResponses

export const DEFAULT_OPENAPI_COMPONENT_SCHEMAS = {
  OpenapiValidationErrors: {
    type: 'object',
    required: ['type', 'target', 'errors'],
    properties: {
      type: {
        type: 'string',
        enum: ['openapi'],
      },
      target: {
        type: 'string',
        enum: OpenapiValidateTargets,
      },
      errors: {
        type: 'array',
        items: {
          type: 'object',
          required: ['instancePath', 'schemaPath', 'keyword', 'message', 'params'],
          properties: {
            instancePath: { type: 'string' },
            schemaPath: { type: 'string' },
            keyword: { type: 'string' },
            message: { type: 'string' },
            params: { type: 'object' },
          },
        },
      },
    },
  },

  ValidationErrors: {
    type: 'object',
    required: ['type', 'errors'],
    properties: {
      type: {
        type: 'string',
        enum: ['validation'],
      },
      errors: {
        // this is how you specify a {[key: string]: string[] } pattern in openapi
        type: 'object',
        additionalProperties: {
          type: 'array',
          items: {
            type: 'string',
          },
        },
      },
    },
  },
} as Record<string, OpenapiSchemaBody>

export const DEFAULT_OPENAPI_COMPONENT_RESPONSES = {
  // 204
  NoContent: {
    description: 'The request has succeeded, but there is no content to render',
  },

  // 400
  BadRequest: {
    description:
      'The server would not process the request due to something the server considered to be a client error',
  },

  // 401
  Unauthorized: {
    description:
      'The request was not successful because it lacks valid authentication credentials for the requested resource',
  },

  // 403
  Forbidden: {
    description: 'Understood the request, but refused to process it',
  },

  // 404
  NotFound: {
    description: 'The specified resource was not found',
  },

  // 409
  Conflict: {
    description: 'The request failed because a conflict was detected with the given request params',
  },

  // 422
  ValidationErrors: {
    description: 'The request failed to process due to validation errors with the provided values',
    content: {
      'application/json': {
        schema: {
          $ref: '#/components/schemas/ValidationErrors',
        },
      },
    },
  },

  // 500
  InternalServerError: {
    description:
      'the server encountered an unexpected condition that prevented it from fulfilling the request',
  },
} as Record<string, OpenapiContent>
