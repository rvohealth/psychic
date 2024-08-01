import OpenapiAppRenderer from '../../../src/openapi-renderer/app'
import packageJson from '../../../package.json'

describe('OpenapiAppRenderer', () => {
  describe('.buildOpenapiObject', () => {
    it('reads all controllers and consolidates endpoints, also providing boilerplate openapi headers', async () => {
      const response = await OpenapiAppRenderer.toObject()

      expect(response).toEqual({
        openapi: '3.0.2',
        info: {
          version: packageJson.version,
          title: packageJson.name,
          description: packageJson.description,
        },
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        paths: expect.objectContaining({
          '/greeter/justforspecs': {
            parameters: [],
            get: {
              tags: [],
              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
              responses: expect.objectContaining({
                '200': {
                  description: 'justforspecs',
                  content: {
                    'application/json': {
                      schema: {
                        $ref: '#/components/schemas/CommentTestingBasicSerializerRef',
                      },
                    },
                  },
                },
              }),
            },
          },

          '/users': {
            parameters: [],
            post: {
              tags: [],
              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
              responses: expect.objectContaining({
                201: {
                  description: 'create',
                  content: {
                    'application/json': {
                      schema: {
                        $ref: '#/components/schemas/UserExtra',
                      },
                    },
                  },
                },
              }),
            },
            get: {
              tags: [],
              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
              responses: expect.objectContaining({
                200: {
                  description: 'index',
                  content: {
                    'application/json': {
                      schema: {
                        type: 'array',
                        items: {
                          $ref: '#/components/schemas/UserExtra',
                        },
                      },
                    },
                  },
                },
              }),
            },
          },

          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          '/users/{id}': expect.objectContaining({
            parameters: [
              {
                in: 'path',
                name: 'id',
                required: true,
                description: 'id',
                schema: {
                  type: 'string',
                },
              },
            ],
            get: {
              tags: [],
              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
              responses: expect.objectContaining({
                '200': {
                  description: 'show',
                  content: {
                    'application/json': { schema: { $ref: '#/components/schemas/UserWithPosts' } },
                  },
                },
              }),
            },

            delete: {
              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
              responses: expect.objectContaining({
                '204': {
                  description: 'no content',
                },
              }),
              tags: [],
            },
          }),
        }),

        components: {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          schemas: expect.objectContaining({
            UserExtra: {
              type: 'object',
              required: ['id', 'nicknames', 'howyadoin'],
              properties: {
                id: {
                  type: 'string',
                },
                nicknames: {
                  type: 'array',
                  items: {
                    type: 'string',
                  },
                },
                howyadoin: {
                  type: 'object',
                  properties: {
                    name: {
                      type: 'string',
                    },
                    stuff: {
                      type: 'array',
                      items: {
                        type: 'string',
                      },
                    },
                    nestedStuff: {
                      type: 'object',
                      properties: {
                        nested1: {
                          type: 'boolean',
                        },
                        nested2: {
                          type: 'array',
                          items: {
                            type: 'number',
                            format: 'decimal',
                          },
                        },
                      },
                    },
                  },
                },
              },
            },

            UserWithPosts: {
              type: 'object',
              required: ['id', 'posts'],
              properties: {
                id: { type: 'string' },
                posts: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/PostWithComments' },
                },
              },
            },

            PostWithComments: {
              type: 'object',
              required: ['id', 'body', 'comments'],
              properties: {
                id: { type: 'string' },
                body: { type: 'string' },
                comments: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Comment' },
                },
              },
            },

            Comment: {
              type: 'object',
              required: ['id', 'body'],
              properties: {
                id: { type: 'string' },
                body: { type: 'string' },
              },
            },

            CommentTestingBasicSerializerRef: {
              type: 'object',
              required: ['howyadoin'],
              properties: {
                howyadoin: {
                  $ref: '#/components/schemas/CommentTestingDoubleShorthand',
                },
              },
            },

            CommentTestingDoubleShorthand: {
              type: 'object',
              required: ['howyadoin'],
              properties: { howyadoin: { type: 'number', format: 'double' } },
            },

            ValidationErrors: {
              type: 'object',
              properties: {
                errors: {
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

            CustomSchema: {
              type: 'string',
            },
          }),

          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          responses: expect.objectContaining({
            CustomResponse: {
              description: 'my custom response',
              content: {
                'application/json': {
                  schema: {
                    type: 'string',
                  },
                },
              },
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
          }),
        },
      })
    })
  })
})
