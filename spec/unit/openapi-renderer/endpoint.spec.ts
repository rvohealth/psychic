import OpenapiEndpointRenderer from '../../../src/openapi-renderer/endpoint'
import UsersController from '../../../test-app/app/controllers/UsersController'
import Pet from '../../../test-app/app/models/Pet'
import Post from '../../../test-app/app/models/Post'
import User from '../../../test-app/app/models/User'
import PostSerializer from '../../../test-app/app/serializers/PostSerializer'
import UserSerializer, {
  UserWithPostsMultiType2Serializer,
  UserWithPostsMultiTypeSerializer,
} from '../../../test-app/app/serializers/UserSerializer'

describe('OpenapiEndpointRenderer', () => {
  describe('#toSchemaObject', () => {
    it("uses the corresponding serializer to the dream model and converts it's payload shape to openapi format", async () => {
      const renderer = new OpenapiEndpointRenderer(() => User, UsersController, 'howyadoin', {
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

    context('with multiple dream models passed to callback', () => {
      it('renders the association as a ref, also providing a schema definition for the associated serializer', async () => {
        const renderer = new OpenapiEndpointRenderer(() => [Pet, User], UsersController, 'howyadoin', {
          method: 'get',
          serializerKey: 'default',
        })

        const response = await renderer.toSchemaObject()
        expect(response).toEqual(
          expect.objectContaining({
            Pet: {
              type: 'object',
              required: ['id', 'name'],
              properties: {
                id: { type: 'string', nullable: false },
                name: { type: 'object' },
              },
            },
            User: {
              type: 'object',
              required: ['id', 'email', 'name'],
              properties: {
                id: { type: 'string', nullable: false },
                email: { type: 'string', nullable: false },
                name: { type: 'string', nullable: false },
              },
            },
          }),
        )
      })
    })

    context('with a serializer that contains an association', () => {
      context('RendersOne', () => {
        it('renders the association as a ref, also providing a schema definition for the associated serializer', async () => {
          const renderer = new OpenapiEndpointRenderer(() => Pet, UsersController, 'howyadoin', {
            path: '/how/yadoin',
            method: 'get',
            serializerKey: 'withAssociation',
          })
          const response = await renderer.toSchemaObject()
          expect(response).toEqual(
            expect.objectContaining({
              PetWithAssociation: {
                type: 'object',
                required: ['user'],
                properties: {
                  user: { $ref: '#/components/schemas/User' },
                },
              },
              User: {
                type: 'object',
                required: ['id', 'email', 'name'],
                properties: {
                  id: { type: 'string', nullable: false },
                  email: { type: 'string', nullable: false },
                  name: { type: 'string', nullable: false },
                },
              },
            }),
          )
        })

        context('with a nested association', () => {
          it('provides schema for the nested association', async () => {
            const renderer = new OpenapiEndpointRenderer(() => User, UsersController, 'howyadoin', {
              path: '/how/yadoin',
              method: 'get',
              serializerKey: 'withRecentPost',
            })

            const response = await renderer.toSchemaObject()
            expect(response).toEqual(
              expect.objectContaining({
                Comment: {
                  type: 'object',
                  required: ['id', 'body'],
                  properties: {
                    id: { type: 'string', nullable: false },
                    body: { type: 'string', nullable: false },
                  },
                },
              }),
            )
          })
        })
      })

      context('RendersMany', () => {
        it('renders the association as an array of $refs, also providing a schema definition for the associated serializer', async () => {
          const renderer = new OpenapiEndpointRenderer(() => Post, UsersController, 'howyadoin', {
            path: '/how/yadoin',
            method: 'get',
            serializerKey: 'withComments',
          })

          const response = await renderer.toSchemaObject()
          expect(response).toEqual(
            expect.objectContaining({
              PostWithComments: {
                type: 'object',
                required: ['id', 'body', 'comments'],
                properties: {
                  id: { type: 'string', nullable: false },
                  body: { type: 'string', nullable: false },
                  comments: { type: 'array', items: { $ref: '#/components/schemas/Comment' } },
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
          )
        })

        context('with a nested association', () => {
          it('provides schema for the nested association', async () => {
            const renderer = new OpenapiEndpointRenderer(() => User, UsersController, 'howyadoin', {
              path: '/how/yadoin',
              method: 'get',
              serializerKey: 'withPosts',
            })

            const response = await renderer.toSchemaObject()
            expect(response).toEqual(
              expect.objectContaining({
                Comment: {
                  type: 'object',
                  required: ['id', 'body'],
                  properties: {
                    id: { type: 'string', nullable: false },
                    body: { type: 'string', nullable: false },
                  },
                },
              }),
            )
          })
        })
      })

      context('rendering an association which contains an array of serializers', () => {
        it('encases expression in an anyOf, wrapping all serializers present', async () => {
          const renderer = new OpenapiEndpointRenderer(
            () => UserWithPostsMultiTypeSerializer,
            UsersController,
            'howyadoin',
            {
              path: '/how/yadoin',
              method: 'get',
            },
          )

          const response = await renderer.toSchemaObject()
          expect(response).toEqual(
            expect.objectContaining({
              Comment: {
                type: 'object',
                required: ['id', 'body'],
                properties: {
                  id: { type: 'string', nullable: false },
                  body: { type: 'string', nullable: false },
                },
              },

              UserWithPostsMultiType: {
                type: 'object',
                required: ['id', 'posts'],
                properties: {
                  id: { type: 'string', nullable: false },
                  posts: {
                    anyOf: [
                      {
                        type: 'array',
                        items: { $ref: '#/components/schemas/PostWithComments' },
                      },
                      {
                        type: 'array',
                        items: { $ref: '#/components/schemas/PostWithRecentComment' },
                      },
                    ],
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

              PostWithRecentComment: {
                type: 'object',
                required: ['id', 'body', 'recentComment'],
                properties: {
                  id: { type: 'string', nullable: false },
                  body: { type: 'string', nullable: false },
                  recentComment: { $ref: '#/components/schemas/Comment' },
                },
              },
            }),
          )
        })
      })

      context('rendering an association which contains an array of dreams', () => {
        it('extracts serializers from each dream, then encases expression in an anyOf, wrapping all identified serializers', async () => {
          const renderer = new OpenapiEndpointRenderer(
            () => UserWithPostsMultiType2Serializer,
            UsersController,
            'howyadoin',
            {
              path: '/how/yadoin',
              method: 'get',
            },
          )

          const response = await renderer.toSchemaObject()
          expect(response).toEqual(
            expect.objectContaining({
              UserWithPostsMultiType2: {
                type: 'object',
                required: ['id', 'posts'],
                properties: {
                  id: { type: 'string', nullable: false },
                  posts: {
                    anyOf: [
                      {
                        type: 'array',
                        items: { $ref: '#/components/schemas/PostSummary' },
                      },
                      {
                        type: 'array',
                        items: { $ref: '#/components/schemas/UserSummary' },
                      },
                    ],
                  },
                },
              },
            }),
          )
        })
      })
    })
  })

  describe('#toObject', () => {
    context('tags', () => {
      it('renders provided tags', async () => {
        const renderer = new OpenapiEndpointRenderer(() => User, UsersController, 'howyadoin', {
          path: '/hello/world',
          method: 'get',
          tags: ['hello', 'world'],
        })

        const response = await renderer.toObject()
        expect(response).toEqual(
          expect.objectContaining({
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            '/hello/world': expect.objectContaining({
              get: expect.objectContaining({
                tags: ['hello', 'world'],
              }),
            }),
          }),
        )
      })
    })

    context('method', () => {
      it('renders provided method', async () => {
        const renderer = new OpenapiEndpointRenderer(() => User, UsersController, 'howyadoin', {
          path: '/hello/world',
          method: 'get',
          tags: ['hello', 'world'],
        })

        const response = await renderer.toObject()
        expect(response).toEqual(
          expect.objectContaining({
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            '/hello/world': expect.objectContaining({
              get: expect.objectContaining({
                tags: ['hello', 'world'],
              }),
            }),
          }),
        )
      })

      context('with no method provided', () => {
        it('infers the method by examining routes', async () => {
          const renderer = new OpenapiEndpointRenderer(() => User, UsersController, 'show')

          const response = await renderer.toObject()
          expect(response).toEqual(
            expect.objectContaining({
              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
              '/users/{id}': expect.objectContaining({
                get: expect.objectContaining({
                  responses: {
                    '200': {
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

      context('when the method cannot be inferred by routes', () => {
        it('infers the method by examining routes', async () => {
          const renderer = new OpenapiEndpointRenderer(null, UsersController, 'destroy', {
            path: '/users/{id}',
          })

          const response = await renderer.toObject()
          expect(response).toEqual(
            expect.objectContaining({
              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
              '/users/{id}': expect.objectContaining({
                delete: expect.objectContaining({
                  responses: {
                    '204': {
                      description: 'no content',
                    },
                  },
                }),
              }),
            }),
          )
        })
      })
    })

    context('uri', () => {
      it('renders params within the parameters array', async () => {
        const renderer = new OpenapiEndpointRenderer(() => User, UsersController, 'howyadoin', {
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
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
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

    context('query', () => {
      it('renders params within the parameters array', async () => {
        const renderer = new OpenapiEndpointRenderer(() => User, UsersController, 'howyadoin', {
          path: '/how/yadoin',
          method: 'get',
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
            '/how/yadoin': expect.objectContaining({
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
            path: '/how/yadoin',
            method: 'get',
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
              '/how/yadoin': expect.objectContaining({
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
        const renderer = new OpenapiEndpointRenderer(() => User, UsersController, 'howyadoin', {
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
          const renderer = new OpenapiEndpointRenderer(() => User, UsersController, 'howyadoin', {
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
          const renderer = new OpenapiEndpointRenderer(
            () => UserWithPostsMultiTypeSerializer,
            UsersController,
            'howyadoin',
            {
              path: '/how/yadoin',
              method: 'get',
            },
          )

          const response = await renderer.toObject()
          expect(response['/how/yadoin'].get.responses).toEqual(
            expect.objectContaining({
              200: {
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/UserWithPostsMultiType',
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
          const renderer = new OpenapiEndpointRenderer(() => [User, Post], UsersController, 'howyadoin', {
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
            () => [UserSerializer, PostSerializer<any, any>],
            UsersController,
            'howyadoin',
            {
              path: '/how/yadoin',
              method: 'get',
            },
          )

          const response = await renderer.toObject()
          expect(response['/how/yadoin'].get.responses).toEqual(
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

      context('with no path passed', () => {
        it('infers the path using the psychic routing engine', async () => {
          const renderer = new OpenapiEndpointRenderer(() => User, UsersController, 'howyadoin', {
            method: 'get',
            status: 201,
          })

          const response = await renderer.toObject()
          expect(response['/users/howyadoin'].get.responses).toEqual(
            expect.objectContaining({
              201: {
                content: {
                  'application/json': { schema: { $ref: '#/components/schemas/User' } },
                },
              },
            }),
          )
        })
      })

      context('with allOf', () => {
        it('returns valid openapi', async () => {
          const renderer = new OpenapiEndpointRenderer(() => User, UsersController, 'howyadoin', {
            path: '/how/yadoin',
            method: 'get',
            serializerKey: 'extra',
            responses: {
              201: {
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
          expect(response['/how/yadoin'].get.responses).toEqual(
            expect.objectContaining({
              201: {
                content: {
                  'application/json': {
                    schema: {
                      allOf: [
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

      context('with anyOf', () => {
        it('returns valid openapi', async () => {
          const renderer = new OpenapiEndpointRenderer(() => User, UsersController, 'howyadoin', {
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
          const renderer = new OpenapiEndpointRenderer(() => User, UsersController, 'howyadoin', {
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

      context('with $ref', () => {
        it('returns valid openapi', async () => {
          const renderer = new OpenapiEndpointRenderer(() => User, UsersController, 'howyadoin', {
            path: '/how/yadoin',
            method: 'get',
            serializerKey: 'extra',
            responses: {
              201: {
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
          expect(response['/how/yadoin'].get.responses).toEqual(
            expect.objectContaining({
              201: {
                content: {
                  'application/json': {
                    schema: {
                      oneOf: [
                        {
                          $ref: '#/components/schemas/Howyadoin',
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

      context('with $schema', () => {
        it('returns valid openapi', async () => {
          const renderer = new OpenapiEndpointRenderer(() => User, UsersController, 'howyadoin', {
            path: '/how/yadoin',
            method: 'get',
            serializerKey: 'extra',
            responses: {
              201: {
                $schema: 'Howyadoin',
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
            path: '/how/yadoin',
            method: 'get',
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
          expect(response['/how/yadoin'].get.responses).toEqual(
            expect.objectContaining({
              201: {
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
            path: '/how/yadoin',
            method: 'get',
            serializerKey: 'extra',
            responses: {
              201: {
                type: 'string',
                enum: ['hello', 'world'],
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
                      type: 'string',
                      nullable: false,
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
          const renderer = new OpenapiEndpointRenderer(() => User, UsersController, 'howyadoin', {
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
