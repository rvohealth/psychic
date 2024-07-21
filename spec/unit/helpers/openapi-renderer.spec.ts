import OpenapiRenderer from '../../../src/helpers/openapi-renderer'
import User from '../../../test-app/app/models/User'
import { UserExtraSerializer } from '../../../test-app/app/serializers/UserSerializer'

describe('OpenapiRenderer', () => {
  describe('.buildOpenapiObject', () => {
    it('reads all controllers and consolidates endpoints, also providing boilerplate openapi headers', async () => {
      const response = await OpenapiRenderer.buildOpenapiObject()
      expect(response).toEqual({
        openapi: '3.0.2',
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

  describe('#toSchemaObject', () => {
    it("uses the corresponding serializer to the dream model and converts it's payload shape to openapi format", async () => {
      const renderer = new OpenapiRenderer(() => User, {
        path: '/how/yadoin',
        method: 'get',
        serializerKey: 'extra',
      })

      const response = await renderer.toSchemaObject()
      expect(response).toEqual({
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
                  nullable: false,
                  items: {
                    type: 'string',
                    nullable: false,
                  },
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
                      nullable: false,
                      items: {
                        type: 'decimal',
                        nullable: false,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      })
    })
  })

  describe('#toObject', () => {
    context('uri', () => {
      it('renders params within the parameters array', async () => {
        const renderer = new OpenapiRenderer(() => User, {
          path: '/how/yadoin',
          method: 'get',
          uri: [
            {
              name: 'search',
              required: true,
              description: 'the search term',
            },
          ],
        })

        const response = await renderer.toObject()
        expect(response).toEqual(
          expect.objectContaining({
            '/how/yadoin': expect.objectContaining({
              parameters: [
                {
                  in: 'path',
                  name: 'search',
                  required: true,
                  description: 'the search term',
                  schema: {
                    type: 'string',
                  },
                },
              ],
            }),
          }),
        )
      })
    })

    context('body', () => {
      it('renders params within the parameters array', async () => {
        const renderer = new OpenapiRenderer(() => User, {
          path: '/how/yadoin',
          method: 'get',
          body: {
            type: 'object',
            required: ['email', 'password'],
            properties: {
              email: 'string',
              password: {
                type: 'string',
                nullable: true,
              },
              settings: {
                type: 'object',
                properties: {
                  likesChalupas: 'boolean',
                },
              },
            },
          },
        })

        const response = await renderer.toObject()
        expect(response['/how/yadoin'].get.requestBody).toEqual({
          content: {
            'application/json': {
              schema: {
                type: 'object',
                nullable: false,
                required: ['email', 'password'],
                properties: {
                  email: {
                    type: 'string',
                    nullable: false,
                  },
                  password: {
                    type: 'string',
                    nullable: true,
                  },
                  settings: {
                    type: 'object',
                    nullable: false,
                    properties: {
                      likesChalupas: {
                        type: 'boolean',
                        nullable: false,
                      },
                    },
                  },
                },
              },
            },
          },
        })
      })
    })

    context('response', () => {
      context('with a dream model passed', () => {
        it("uses the corresponding serializer to the dream model and converts it's payload shape to openapi format", async () => {
          const renderer = new OpenapiRenderer(() => User, {
            path: '/how/yadoin',
            method: 'get',
            serializerKey: 'extra',
          })

          const response = await renderer.toObject()
          expect(response['/how/yadoin'].get.responses).toEqual(
            expect.objectContaining({
              200: {
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/UserExtra',
                    },
                  },
                },
              },
            }),
          )
        })
      })

      context('with a serializer passed', () => {
        it("uses the provided serializer, converting it's payload shape to openapi format", async () => {
          const renderer = new OpenapiRenderer(() => UserExtraSerializer, {
            path: '/how/yadoin',
            method: 'get',
          })

          const response = await renderer.toObject()
          expect(response['/how/yadoin'].get.responses).toEqual(
            expect.objectContaining({
              200: {
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/UserExtra',
                    },
                  },
                },
              },
            }),
          )
        })
      })

      context('with anyOf', () => {
        it('returns valid openapi', async () => {
          const renderer = new OpenapiRenderer(() => User, {
            path: '/how/yadoin',
            method: 'get',
            serializerKey: 'extra',
            responses: {
              201: {
                anyOf: [
                  {
                    type: 'object',
                    properties: {
                      name: 'string',
                      email: 'string',
                    },
                  },
                  {
                    type: 'string',
                  },
                ],
              },
            },
          })

          const response = await renderer.toObject()
          expect(response['/how/yadoin'].get.responses).toEqual(
            expect.objectContaining({
              201: {
                content: {
                  'application/json': {
                    schema: {
                      anyOf: [
                        {
                          type: 'object',
                          nullable: false,
                          properties: {
                            name: {
                              type: 'string',
                              nullable: false,
                            },
                            email: {
                              type: 'string',
                              nullable: false,
                            },
                          },
                        },
                        {
                          type: 'string',
                          nullable: false,
                        },
                      ],
                    },
                  },
                },
              },
            }),
          )
        })
      })

      context('with oneOf', () => {
        it('returns valid openapi', async () => {
          const renderer = new OpenapiRenderer(() => User, {
            path: '/how/yadoin',
            method: 'get',
            serializerKey: 'extra',
            responses: {
              201: {
                oneOf: [
                  {
                    type: 'object',
                    properties: {
                      name: 'string',
                      email: 'string',
                    },
                  },
                  {
                    type: 'string',
                  },
                ],
              },
            },
          })

          const response = await renderer.toObject()
          expect(response['/how/yadoin'].get.responses).toEqual(
            expect.objectContaining({
              201: {
                content: {
                  'application/json': {
                    schema: {
                      oneOf: [
                        {
                          type: 'object',
                          nullable: false,
                          properties: {
                            name: {
                              type: 'string',
                              nullable: false,
                            },
                            email: {
                              type: 'string',
                              nullable: false,
                            },
                          },
                        },
                        {
                          type: 'string',
                          nullable: false,
                        },
                      ],
                    },
                  },
                },
              },
            }),
          )
        })
      })

      context('with many=true', () => {
        it("uses the corresponding serializer to the dream model and converts it's payload shape to openapi format", async () => {
          const renderer = new OpenapiRenderer(() => User, {
            path: '/how/yadoin',
            method: 'get',
            serializerKey: 'extra',
            many: true,
          })

          const response = await renderer.toObject()
          expect(response['/how/yadoin'].get.responses).toEqual(
            expect.objectContaining({
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
            }),
          )
        })
      })

      context('with extra response fields sent', () => {
        it('includes extra response payloads', async () => {
          const renderer = new OpenapiRenderer(() => User, {
            path: '/how/yadoin',
            method: 'get',
            serializerKey: 'extra',
            responses: {
              201: {
                type: 'object',
                required: ['user'],
                properties: {
                  user: {
                    type: 'object',
                    required: ['name', 'email'],
                    properties: {
                      name: 'string',
                      email: 'string',
                      firstName: {
                        type: 'string',
                        nullable: true,
                      },
                      things: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            name: 'string',
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          })

          const response = await renderer.toObject()
          expect(response['/how/yadoin'].get.responses).toEqual(
            expect.objectContaining({
              201: {
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      nullable: false,
                      required: ['user'],
                      properties: {
                        user: {
                          type: 'object',
                          nullable: false,
                          required: ['name', 'email'],
                          properties: {
                            name: {
                              type: 'string',
                              nullable: false,
                            },
                            email: {
                              type: 'string',
                              nullable: false,
                            },
                            firstName: {
                              type: 'string',
                              nullable: true,
                            },
                            things: {
                              type: 'array',
                              nullable: false,
                              items: {
                                type: 'object',
                                nullable: false,
                                properties: {
                                  name: {
                                    type: 'string',
                                    nullable: false,
                                  },
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            }),
          )
        })
      })
    })
  })
})
