import OpenapiEndpointRenderer from '../../../src/openapi-renderer/endpoint'
import UsersController from '../../../test-app/app/controllers/UsersController'
import Pet from '../../../test-app/app/models/Pet'
import Post from '../../../test-app/app/models/Post'
import User from '../../../test-app/app/models/User'
import {
  CommentTestingDateSerializer,
  CommentTestingDateTimeSerializer,
  CommentTestingDefaultObjectFieldsSerializer,
  CommentTestingIntegerSerializer,
  CommentTestingStringSerializer,
  CommentWithAllOfArraySerializer,
  CommentWithAllOfObjectSerializer,
  CommentWithAnyOfArraySerializer,
  CommentWithAnyOfObjectSerializer,
  CommentWithOneOfArraySerializer,
  CommentWithOneOfObjectSerializer,
} from '../../../test-app/app/serializers/CommentSerializer'
import PostSerializer from '../../../test-app/app/serializers/PostSerializer'
import UserSerializer, {
  UserWithPostsMultiType2Serializer,
  UserWithPostsMultiTypeSerializer,
} from '../../../test-app/app/serializers/UserSerializer'

describe('OpenapiEndpointRenderer', () => {
  describe('#toSchemaObject', () => {
    it("uses the corresponding serializer to the dream model and converts it's payload shape to openapi format", async () => {
      const renderer = new OpenapiEndpointRenderer(() => User, UsersController, 'howyadoin', {
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

    context('with an integer type passed', () => {
      it('supports integer type fields, including minimum and maximum', async () => {
        const renderer = new OpenapiEndpointRenderer(
          () => CommentTestingIntegerSerializer,
          UsersController,
          'howyadoin',
          {},
        )

        const response = await renderer.toSchemaObject()
        expect(response).toEqual(
          expect.objectContaining({
            CommentTestingInteger: {
              type: 'object',
              required: ['howyadoin'],
              properties: {
                howyadoin: {
                  type: 'integer',
                  minimum: 10,
                  maximum: 20,
                  nullable: false,
                },
              },
            },
          }),
        )
      })
    })

    context('with a date type passed', () => {
      it('supports integer type fields, including minimum and maximum', async () => {
        const renderer = new OpenapiEndpointRenderer(
          () => CommentTestingDateSerializer,
          UsersController,
          'howyadoin',
          {},
        )

        const response = await renderer.toSchemaObject()
        expect(response).toEqual(
          expect.objectContaining({
            CommentTestingDate: {
              type: 'object',
              required: ['howyadoin', 'howyadoins'],
              properties: {
                howyadoin: {
                  type: 'string',
                  nullable: false,
                  format: 'date',
                },
                howyadoins: {
                  type: 'array',
                  items: {
                    type: 'string',
                    nullable: false,
                    format: 'date',
                  },
                  nullable: false,
                },
              },
            },
          }),
        )
      })
    })

    context('with a date-time type passed', () => {
      it('supports integer type fields, including minimum and maximum', async () => {
        const renderer = new OpenapiEndpointRenderer(
          () => CommentTestingDateTimeSerializer,
          UsersController,
          'howyadoin',
          {},
        )

        const response = await renderer.toSchemaObject()
        expect(response).toEqual(
          expect.objectContaining({
            CommentTestingDateTime: {
              type: 'object',
              required: ['howyadoin', 'howyadoins'],
              properties: {
                howyadoin: {
                  type: 'string',
                  nullable: false,
                  format: 'date-time',
                },
                howyadoins: {
                  type: 'array',
                  items: {
                    type: 'string',
                    nullable: false,
                    format: 'date-time',
                  },
                  nullable: false,
                },
              },
            },
          }),
        )
      })
    })

    context('with a string type passed', () => {
      it('supports format and enum fields', async () => {
        const renderer = new OpenapiEndpointRenderer(
          () => CommentTestingStringSerializer,
          UsersController,
          'howyadoin',
          {},
        )

        const response = await renderer.toSchemaObject()
        expect(response).toEqual(
          expect.objectContaining({
            CommentTestingString: {
              type: 'object',
              required: ['howyadoin'],
              properties: {
                howyadoin: {
                  type: 'string',
                  nullable: false,
                  format: 'date',
                  enum: ['hello', 'world'],
                },
              },
            },
          }),
        )
      })
    })

    context('with an object type passed', () => {
      it('supports maxProperties and additionalProperties fields', async () => {
        const renderer = new OpenapiEndpointRenderer(
          () => CommentTestingDefaultObjectFieldsSerializer,
          UsersController,
          'howyadoin',
          {
            serializerKey: 'default',
          },
        )

        const response = await renderer.toSchemaObject()
        expect(response).toEqual(
          expect.objectContaining({
            CommentTestingDefaultObjectFields: {
              type: 'object',
              required: ['howyadoin'],
              properties: {
                howyadoin: {
                  type: 'object',
                  nullable: false,
                  maxProperties: 10,
                  properties: {},
                  additionalProperties: {
                    oneOf: [
                      { type: 'string', nullable: false },
                      { type: 'boolean', nullable: false },
                    ],
                  },
                },
              },
            },
          }),
        )
      })

      it('supports anyOf expression', async () => {
        const renderer = new OpenapiEndpointRenderer(
          () => CommentWithAnyOfObjectSerializer,
          UsersController,
          'howyadoin',
          {
            serializerKey: 'default',
          },
        )
        const response = await renderer.toSchemaObject()
        expect(response).toEqual(
          expect.objectContaining({
            CommentWithAnyOfObject: {
              type: 'object',
              required: ['howyadoin'],
              properties: {
                howyadoin: {
                  anyOf: [
                    { type: 'string', nullable: false },
                    { type: 'boolean', nullable: false },
                  ],
                },
              },
            },
          }),
        )
      })

      it('supports allOf expression', async () => {
        const renderer = new OpenapiEndpointRenderer(
          () => CommentWithAllOfObjectSerializer,
          UsersController,
          'howyadoin',
          {
            serializerKey: 'default',
          },
        )
        const response = await renderer.toSchemaObject()
        expect(response).toEqual(
          expect.objectContaining({
            CommentWithAllOfObject: {
              type: 'object',
              required: ['howyadoin'],
              properties: {
                howyadoin: {
                  allOf: [
                    { type: 'string', nullable: false },
                    { type: 'boolean', nullable: false },
                  ],
                },
              },
            },
          }),
        )
      })

      it('supports oneOf expression', async () => {
        const renderer = new OpenapiEndpointRenderer(
          () => CommentWithOneOfObjectSerializer,
          UsersController,
          'howyadoin',
          {
            serializerKey: 'default',
          },
        )
        const response = await renderer.toSchemaObject()
        expect(response).toEqual(
          expect.objectContaining({
            CommentWithOneOfObject: {
              type: 'object',
              required: ['howyadoin'],
              properties: {
                howyadoin: {
                  oneOf: [
                    { type: 'string', nullable: false },
                    { type: 'boolean', nullable: false },
                  ],
                },
              },
            },
          }),
        )
      })
    })

    context('with an array type passed', () => {
      context('items on the array or leveraging an expression', () => {
        context('anyOf', () => {
          it('renders anyOf expression', async () => {
            const renderer = new OpenapiEndpointRenderer(
              () => CommentWithAnyOfArraySerializer,
              UsersController,
              'howyadoin',
              {
                serializerKey: 'default',
              },
            )
            const response = await renderer.toSchemaObject()
            expect(response).toEqual(
              expect.objectContaining({
                CommentWithAnyOfArray: {
                  type: 'object',
                  required: ['howyadoin'],
                  properties: {
                    howyadoin: {
                      type: 'array',
                      items: {
                        anyOf: [
                          { type: 'string', nullable: false },
                          { type: 'boolean', nullable: false },
                        ],
                      },
                      nullable: false,
                    },
                  },
                },
              }),
            )
          })
        })

        context('allOf', () => {
          it('renders allOf expression', async () => {
            const renderer = new OpenapiEndpointRenderer(
              () => CommentWithAllOfArraySerializer,
              UsersController,
              'howyadoin',
              {
                serializerKey: 'default',
              },
            )
            const response = await renderer.toSchemaObject()
            expect(response).toEqual(
              expect.objectContaining({
                CommentWithAllOfArray: {
                  type: 'object',
                  required: ['howyadoin'],
                  properties: {
                    howyadoin: {
                      type: 'array',
                      items: {
                        allOf: [
                          { type: 'string', nullable: false },
                          { type: 'boolean', nullable: false },
                        ],
                      },
                      nullable: false,
                    },
                  },
                },
              }),
            )
          })
        })

        context('oneOf', () => {
          it('renders anyOf expression', async () => {
            const renderer = new OpenapiEndpointRenderer(
              () => CommentWithOneOfArraySerializer,
              UsersController,
              'howyadoin',
              {
                serializerKey: 'default',
              },
            )
            const response = await renderer.toSchemaObject()
            expect(response).toEqual(
              expect.objectContaining({
                CommentWithOneOfArray: {
                  type: 'object',
                  required: ['howyadoin'],
                  properties: {
                    howyadoin: {
                      type: 'array',
                      items: {
                        oneOf: [
                          { type: 'string', nullable: false },
                          { type: 'boolean', nullable: false },
                        ],
                      },
                      nullable: false,
                    },
                  },
                },
              }),
            )
          })
        })
      })
    })

    context('with multiple dream models passed to callback', () => {
      it('renders the association as a ref, also providing a schema definition for the associated serializer', async () => {
        const renderer = new OpenapiEndpointRenderer(() => [Pet, User], UsersController, 'howyadoin', {
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
            {},
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
            {},
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
      context('with no method provided', () => {
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
          const renderer = new OpenapiEndpointRenderer(null, UsersController, 'destroy', {})

          const response = await renderer.toObject()
          expect(response).toEqual(
            expect.objectContaining({
              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
              '/users/{id}': expect.objectContaining({
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
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

    context('body', () => {
      it('renders body in the requestBody payload', async () => {
        const renderer = new OpenapiEndpointRenderer(() => User, UsersController, 'howyadoin', {
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
        expect(response['/users/howyadoin'].get.requestBody).toEqual({
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
            serializerKey: 'extra',
          })

          const response = await renderer.toObject()
          expect(response['/users/howyadoin'].get.responses).toEqual(
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
            {},
          )

          const response = await renderer.toObject()
          expect(response['/users/howyadoin'].get.responses).toEqual(
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

      context('with a view model passed', () => {
        class MyViewModel {
          public get serializers() {
            return {
              default: UserWithPostsMultiTypeSerializer,
            }
          }
        }

        it("uses the provided serializer, converting it's payload shape to openapi format", async () => {
          const renderer = new OpenapiEndpointRenderer(() => MyViewModel, UsersController, 'howyadoin', {})

          const response = await renderer.toObject()
          expect(response['/users/howyadoin'].get.responses).toEqual(
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
          expect(response['/users/howyadoin'].get.responses).toEqual(
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
          expect(response['/users/howyadoin'].get.responses).toEqual(
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
          expect(response['/users/howyadoin'].get.responses).toEqual(
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
            serializerKey: 'extra',
            many: true,
          })

          const response = await renderer.toObject()
          expect(response['/users/howyadoin'].get.responses).toEqual(
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
