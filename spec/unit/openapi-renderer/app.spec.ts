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
                  nullable: false,
                },
                nicknames: {
                  type: 'array',
                  nullable: false,
                  items: {
                    type: 'string',
                    nullable: false,
                  },
                },
                howyadoin: {
                  type: 'object',
                  nullable: false,
                  properties: {
                    name: {
                      type: 'string',
                      nullable: false,
                    },
                    stuff: {
                      type: 'array',
                      items: {
                        type: 'string',
                        nullable: false,
                      },
                      nullable: false,
                    },
                    nestedStuff: {
                      type: 'object',
                      nullable: false,
                      properties: {
                        nested1: {
                          type: 'boolean',
                          nullable: false,
                        },
                        nested2: {
                          type: 'array',
                          items: {
                            type: 'number',
                            format: 'decimal',
                            nullable: false,
                          },
                          nullable: false,
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
                id: { type: 'string', nullable: false },
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
                id: { type: 'string', nullable: false },
                body: { type: 'string', nullable: false },
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
                id: { type: 'string', nullable: false },
                body: { type: 'string', nullable: false },
              },
            },
          }),
        },
      })
    })
  })
})
