import OpenapiAppRenderer from '../../../src/openapi-renderer/app'

describe('OpenapiAppRenderer', () => {
  describe('.buildOpenapiObject', () => {
    it('reads all controllers and consolidates endpoints, also providing boilerplate openapi headers', async () => {
      const response = await OpenapiAppRenderer.toObject()
      expect(response).toEqual({
        openapi: '3.0.2',
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        paths: expect.objectContaining({
          '/users': {
            parameters: [],
            post: {
              tags: [],
              summary: '',
              requestBody: {
                content: {
                  'application/json': {
                    schema: undefined,
                  },
                },
              },
              responses: {
                201: {
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
              requestBody: {
                content: {
                  'application/json': {
                    schema: undefined,
                  },
                },
              },
              responses: {
                200: {
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
                            type: 'decimal',
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
          }),
        },
      })
    })
  })
})
