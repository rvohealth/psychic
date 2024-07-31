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
              summary: '',
              responses: {
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
                '204': { description: 'no content' },
              },
            },
          },

          '/users': {
            parameters: [],
            post: {
              tags: [],
              summary: '',
              responses: {
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
              },
            },
            get: {
              tags: [],
              summary: '',
              responses: {
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
              },
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
              summary: '',
              responses: {
                '200': {
                  description: 'show',
                  content: {
                    'application/json': { schema: { $ref: '#/components/schemas/UserWithPosts' } },
                  },
                },
              },
            },

            delete: {
              responses: {
                '204': {
                  description: 'no content',
                },
              },
              summary: '',
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
          }),
        },
      })
    })
  })
})
