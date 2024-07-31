import OpenapiEndpointRenderer from '../../../../src/openapi-renderer/endpoint'
import UsersController from '../../../../test-app/app/controllers/UsersController'
import Post from '../../../../test-app/app/models/Post'
import User from '../../../../test-app/app/models/User'
import { CommentTestingDoubleShorthandSerializer } from '../../../../test-app/app/serializers/CommentSerializer'
import PostSerializer from '../../../../test-app/app/serializers/PostSerializer'
import UserSerializer, { UserWithPostsSerializer } from '../../../../test-app/app/serializers/UserSerializer'

describe('OpenapiEndpointRenderer', () => {
  describe('#toObject', () => {
    context('tags', () => {
      it('renders provided tags', async () => {
        const renderer = new OpenapiEndpointRenderer(() => User, UsersController, 'howyadoin', {
          tags: ['hello', 'world'],
        })

        const response = await renderer.toObject()
        expect(response).toEqual(
          expect.objectContaining({
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            '/users/howyadoin': expect.objectContaining({
              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
              get: expect.objectContaining({
                tags: ['hello', 'world'],
              }),
            }),
          }),
        )
      })
    })

    context('method', () => {
      it('infers the method by examining routes', async () => {
        const renderer = new OpenapiEndpointRenderer(() => User, UsersController, 'show')

        const response = await renderer.toObject()
        expect(response).toEqual(
          expect.objectContaining({
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            '/users/{id}': expect.objectContaining({
              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
              get: expect.objectContaining({
                responses: {
                  '200': {
                    description: 'show',
                    content: {
                      'application/json': { schema: { $ref: '#/components/schemas/User' } },
                    },
                  },
                },
              }),
            }),
          }),
        )
      })
    })

    context('pathParams', () => {
      it('renders params within the parameters array', async () => {
        const renderer = new OpenapiEndpointRenderer(() => User, UsersController, 'howyadoin', {
          pathParams: [
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
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            '/users/howyadoin': expect.objectContaining({
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

      context('when the path contains uri params', () => {
        it('includes the uri params in the parameters block', async () => {
          const renderer = new OpenapiEndpointRenderer(() => User, UsersController, 'show', {
            pathParams: [
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
    })

    context('query', () => {
      it('renders params within the parameters array', async () => {
        const renderer = new OpenapiEndpointRenderer(() => User, UsersController, 'howyadoin', {
          query: [
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
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            '/users/howyadoin': expect.objectContaining({
              parameters: [
                {
                  in: 'query',
                  name: 'search',
                  required: true,
                  description: 'the search term',
                  schema: {
                    type: 'string',
                  },
                  allowReserved: true,
                },
              ],
            }),
          }),
        )
      })

      context('allowReserved is overridden', () => {
        it('applies override', async () => {
          const renderer = new OpenapiEndpointRenderer(() => User, UsersController, 'howyadoin', {
            query: [
              {
                name: 'search',
                required: true,
                description: 'the search term',
                allowReserved: false,
              },
            ],
          })

          const response = await renderer.toObject()
          expect(response).toEqual(
            expect.objectContaining({
              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
              '/users/howyadoin': expect.objectContaining({
                parameters: [
                  {
                    in: 'query',
                    name: 'search',
                    required: true,
                    description: 'the search term',
                    schema: {
                      type: 'string',
                    },
                    allowReserved: false,
                  },
                ],
              }),
            }),
          )
        })
      })
    })

    context('headers', () => {
      it('renders headers within the parameters array', async () => {
        const renderer = new OpenapiEndpointRenderer(() => User, UsersController, 'howyadoin', {
          headers: [
            {
              name: 'Authorization',
              required: true,
              description: 'Auth header',
            },
            {
              name: 'today',
              required: true,
              description: "today's date",
              format: 'date',
            },
          ],
        })

        const response = await renderer.toObject()
        expect(response).toEqual(
          expect.objectContaining({
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            '/users/howyadoin': expect.objectContaining({
              parameters: [
                {
                  in: 'header',
                  name: 'Authorization',
                  required: true,
                  description: 'Auth header',
                  schema: {
                    type: 'string',
                  },
                },
                {
                  in: 'header',
                  name: 'today',
                  required: true,
                  description: "today's date",
                  schema: {
                    type: 'string',
                    format: 'date',
                  },
                },
              ],
            }),
          }),
        )
      })

      context('allowReserved is overridden', () => {
        it('applies override', async () => {
          const renderer = new OpenapiEndpointRenderer(() => User, UsersController, 'howyadoin', {
            query: [
              {
                name: 'search',
                required: true,
                description: 'the search term',
                allowReserved: false,
              },
            ],
          })

          const response = await renderer.toObject()
          expect(response).toEqual(
            expect.objectContaining({
              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
              '/users/howyadoin': expect.objectContaining({
                parameters: [
                  {
                    in: 'query',
                    name: 'search',
                    required: true,
                    description: 'the search term',
                    schema: {
                      type: 'string',
                    },
                    allowReserved: false,
                  },
                ],
              }),
            }),
          )
        })
      })
    })

    context('body', () => {
      it('renders body in the requestBody payload', async () => {
        const renderer = new OpenapiEndpointRenderer(() => User, UsersController, 'create', {
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
        expect(response['/users'].post.requestBody).toEqual({
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: {
                    type: 'string',
                  },
                  password: {
                    type: 'string',
                    nullable: true,
                  },
                  settings: {
                    type: 'object',
                    properties: {
                      likesChalupas: {
                        type: 'boolean',
                      },
                    },
                  },
                },
              },
            },
          },
        })
      })

      context('requestBody is not specified', () => {
        it('does not provide request body', async () => {
          const renderer = new OpenapiEndpointRenderer(() => User, UsersController, 'show')

          const response = await renderer.toObject()
          expect(response['/users/{id}'].get.requestBody).toBeUndefined()
        })
      })
    })

    context('response', () => {
      context('with a dream model passed', () => {
        it("uses the corresponding serializer to the dream model and converts it's payload shape to openapi format", async () => {
          const renderer = new OpenapiEndpointRenderer(() => User, UsersController, 'howyadoin', {
            serializerKey: 'extra',
          })

          const response = await renderer.toObject()
          expect(response['/users/howyadoin'].get.responses).toEqual(
            expect.objectContaining({
              200: {
                description: 'howyadoin',
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

      context('when nullable is set to true in the Openapi decorator call', () => {
        it('makes the top level serializer nullable', async () => {
          const renderer = new OpenapiEndpointRenderer(() => User, UsersController, 'howyadoin', {
            serializerKey: 'withRecentPost',
            nullable: true,
          })

          const response = await renderer.toObject()
          expect(response['/users/howyadoin'].get.responses).toEqual(
            expect.objectContaining({
              200: {
                description: 'howyadoin',
                content: {
                  'application/json': {
                    schema: {
                      allOf: [{ $ref: '#/components/schemas/UserWithRecentPost' }, { nullable: true }],
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
          const renderer = new OpenapiEndpointRenderer(
            () => UserWithPostsSerializer,
            UsersController,
            'howyadoin',
            {},
          )

          const response = await renderer.toObject()
          expect(response['/users/howyadoin'].get.responses).toEqual(
            expect.objectContaining({
              200: {
                description: 'howyadoin',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/UserWithPosts',
                    },
                  },
                },
              },
            }),
          )
        })
      })

      context('with a view model passed', () => {
        class MyViewModel {
          public get serializers() {
            return {
              default: UserWithPostsSerializer,
            }
          }
        }

        it("uses the provided serializer, converting it's payload shape to openapi format", async () => {
          const renderer = new OpenapiEndpointRenderer(() => MyViewModel, UsersController, 'howyadoin', {})

          const response = await renderer.toObject()
          expect(response['/users/howyadoin'].get.responses).toEqual(
            expect.objectContaining({
              200: {
                description: 'howyadoin',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/UserWithPosts',
                    },
                  },
                },
              },
            }),
          )
        })
      })

      context('with an array of dream models passed', () => {
        it("uses the corresponding serializer to the dream model and converts it's payload shape to openapi format", async () => {
          const renderer = new OpenapiEndpointRenderer(() => [User, Post], UsersController, 'howyadoin', {})

          const response = await renderer.toObject()
          expect(response['/users/howyadoin'].get.responses).toEqual(
            expect.objectContaining({
              200: {
                content: {
                  'application/json': {
                    schema: {
                      anyOf: [
                        {
                          $ref: '#/components/schemas/User',
                        },
                        {
                          $ref: '#/components/schemas/Post',
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

      context('with an array of dream serializers passed', () => {
        it("uses the corresponding serializer to the dream model and converts it's payload shape to openapi format", async () => {
          const renderer = new OpenapiEndpointRenderer(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            () => [UserSerializer, PostSerializer<any, any>],
            UsersController,
            'howyadoin',
            {},
          )

          const response = await renderer.toObject()
          expect(response['/users/howyadoin'].get.responses).toEqual(
            expect.objectContaining({
              200: {
                content: {
                  'application/json': {
                    schema: {
                      anyOf: [
                        {
                          $ref: '#/components/schemas/User',
                        },
                        {
                          $ref: '#/components/schemas/Post',
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

      context('with allOf', () => {
        it('returns valid openapi', async () => {
          const renderer = new OpenapiEndpointRenderer(() => User, UsersController, 'howyadoin', {
            serializerKey: 'extra',
            responses: {
              201: {
                description: 'howyadoin',
                allOf: [
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
          expect(response['/users/howyadoin'].get.responses).toEqual(
            expect.objectContaining({
              201: {
                description: 'howyadoin',
                content: {
                  'application/json': {
                    schema: {
                      allOf: [
                        {
                          type: 'object',
                          properties: {
                            name: {
                              type: 'string',
                            },
                            email: {
                              type: 'string',
                            },
                          },
                        },
                        {
                          type: 'string',
                        },
                      ],
                    },
                  },
                },
              },
            }),
          )
        })

        context('allOf includes a $serializer ref', () => {
          it('returns valid openapi', async () => {
            const renderer = new OpenapiEndpointRenderer(() => User, UsersController, 'howyadoin', {
              serializerKey: 'extra',
              responses: {
                201: {
                  description: 'howyadoin',
                  allOf: [
                    {
                      type: 'string',
                    },
                    {
                      $serializer: CommentTestingDoubleShorthandSerializer,
                      nullable: true,
                    },
                  ],
                },
              },
            })

            const response = await renderer.toObject()
            expect(response['/users/howyadoin'].get.responses).toEqual(
              expect.objectContaining({
                201: {
                  description: 'howyadoin',
                  content: {
                    'application/json': {
                      schema: {
                        allOf: [
                          {
                            type: 'string',
                          },
                          {
                            allOf: [
                              {
                                $ref: '#/components/schemas/CommentTestingDoubleShorthand',
                              },
                              { nullable: true },
                            ],
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
      })

      context('with anyOf', () => {
        it('returns valid openapi', async () => {
          const renderer = new OpenapiEndpointRenderer(() => User, UsersController, 'howyadoin', {
            serializerKey: 'extra',
            responses: {
              201: {
                description: 'chalupas for life',
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
          expect(response['/users/howyadoin'].get.responses).toEqual(
            expect.objectContaining({
              201: {
                description: 'chalupas for life',
                content: {
                  'application/json': {
                    schema: {
                      anyOf: [
                        {
                          type: 'object',
                          properties: {
                            name: {
                              type: 'string',
                            },
                            email: {
                              type: 'string',
                            },
                          },
                        },
                        {
                          type: 'string',
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
          const renderer = new OpenapiEndpointRenderer(() => User, UsersController, 'howyadoin', {
            serializerKey: 'extra',
            responses: {
              201: {
                description: 'howyadoin',
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
          expect(response['/users/howyadoin'].get.responses).toEqual(
            expect.objectContaining({
              201: {
                description: 'howyadoin',
                content: {
                  'application/json': {
                    schema: {
                      oneOf: [
                        {
                          type: 'object',
                          properties: {
                            name: {
                              type: 'string',
                            },
                            email: {
                              type: 'string',
                            },
                          },
                        },
                        {
                          type: 'string',
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

      context('with $ref', () => {
        it('returns valid openapi', async () => {
          const renderer = new OpenapiEndpointRenderer(() => User, UsersController, 'howyadoin', {
            serializerKey: 'extra',
            responses: {
              201: {
                description: 'howyadoin',
                oneOf: [
                  {
                    $ref: 'components/schemas/Howyadoin',
                  },
                  {
                    type: 'string',
                  },
                ],
              },
            },
          })

          const response = await renderer.toObject()
          expect(response['/users/howyadoin'].get.responses).toEqual(
            expect.objectContaining({
              201: {
                description: 'howyadoin',
                content: {
                  'application/json': {
                    schema: {
                      oneOf: [
                        {
                          $ref: '#/components/schemas/Howyadoin',
                        },
                        {
                          type: 'string',
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

      context('with $schema', () => {
        it('returns valid openapi', async () => {
          const renderer = new OpenapiEndpointRenderer(() => User, UsersController, 'howyadoin', {
            serializerKey: 'extra',
            responses: {
              201: {
                $schema: 'Howyadoin',
              },
            },
          })

          const response = await renderer.toObject()
          expect(response['/users/howyadoin'].get.responses).toEqual(
            expect.objectContaining({
              201: {
                description: 'howyadoin',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/Howyadoin',
                    },
                  },
                },
              },
            }),
          )
        })
      })

      context('with common fields', () => {
        it('returns valid openapi', async () => {
          const renderer = new OpenapiEndpointRenderer(() => User, UsersController, 'howyadoin', {
            serializerKey: 'extra',
            responses: {
              201: {
                type: 'object',
                description: 'my description',
                summary: 'my summary',
                nullable: true,
              },
            },
          })

          const response = await renderer.toObject()
          expect(response['/users/howyadoin'].get.responses).toEqual(
            expect.objectContaining({
              201: {
                description: 'my description',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      description: 'my description',
                      summary: 'my summary',
                      nullable: true,
                      properties: {},
                    },
                  },
                },
              },
            }),
          )
        })
      })

      context('with enum', () => {
        it('returns valid openapi', async () => {
          const renderer = new OpenapiEndpointRenderer(() => User, UsersController, 'howyadoin', {
            serializerKey: 'extra',
            responses: {
              201: {
                type: 'string',
                enum: ['hello', 'world'],
              },
            },
          })

          const response = await renderer.toObject()
          expect(response['/users/howyadoin'].get.responses).toEqual(
            expect.objectContaining({
              201: {
                description: 'howyadoin',
                content: {
                  'application/json': {
                    schema: {
                      type: 'string',
                      enum: ['hello', 'world'],
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
          const renderer = new OpenapiEndpointRenderer(() => User, UsersController, 'howyadoin', {
            serializerKey: 'extra',
            many: true,
          })

          const response = await renderer.toObject()
          expect(response['/users/howyadoin'].get.responses).toEqual(
            expect.objectContaining({
              200: {
                description: 'howyadoin',
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
          const renderer = new OpenapiEndpointRenderer(() => User, UsersController, 'howyadoin', {
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
          expect(response['/users/howyadoin'].get.responses).toEqual(
            expect.objectContaining({
              201: {
                description: 'howyadoin',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      required: ['user'],
                      properties: {
                        user: {
                          type: 'object',
                          required: ['name', 'email'],
                          properties: {
                            name: {
                              type: 'string',
                            },
                            email: {
                              type: 'string',
                            },
                            firstName: {
                              type: 'string',
                              nullable: true,
                            },
                            things: {
                              type: 'array',
                              items: {
                                type: 'object',
                                properties: {
                                  name: {
                                    type: 'string',
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
