import OpenapiEndpointRenderer from '../../../src/openapi-renderer/endpoint'
import UsersController from '../../../test-app/app/controllers/UsersController'
import Pet from '../../../test-app/app/models/Pet'
import Post from '../../../test-app/app/models/Post'
import User from '../../../test-app/app/models/User'
import { AdminPetSummarySerializer } from '../../../test-app/app/serializers/Admin/PetSerializer'
import AdminUserSerializer from '../../../test-app/app/serializers/Admin/UserSerializer'
import {
  CommentTestingDateSerializer,
  CommentTestingDateTimeSerializer,
  CommentTestingDecimalSerializer,
  CommentTestingDecimalShorthandSerializer,
  CommentTestingDefaultObjectFieldsSerializer,
  CommentTestingDoubleArrayShorthandSerializer,
  CommentTestingDoubleSerializer,
  CommentTestingDoubleShorthandSerializer,
  CommentTestingIntegerSerializer,
  CommentTestingIntegerShorthandSerializer,
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
  UserWithPostsSerializer,
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
      })
    })

    context('with a schemaDelimeter set', () => {
      it('leverages the schemaDelimeter when computing schema names', async () => {
        const renderer = new OpenapiEndpointRenderer(
          () => AdminPetSummarySerializer,
          UsersController,
          'howyadoin',
        )

        jest.spyOn(OpenapiEndpointRenderer.prototype, 'schemaDelimeter', 'get').mockReturnValue('__')

        const response = await renderer.toSchemaObject()
        expect(response).toEqual(
          expect.objectContaining({
            Admin__AdminPetSummary: {
              type: 'object',
              required: ['id'],
              properties: { id: { type: 'string' } },
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
                  format: 'date',
                  enum: ['hello', 'world'],
                  pattern: '/^helloworld$/',
                  minLength: 2,
                  maxLength: 4,
                },
              },
            },
          }),
        )
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
                },
              },
            },
          }),
        )
      })

      context('using shorthand', () => {
        it('expands to integer type', async () => {
          const renderer = new OpenapiEndpointRenderer(
            () => CommentTestingIntegerShorthandSerializer,
            UsersController,
            'howyadoin',
            {},
          )

          const response = await renderer.toSchemaObject()
          expect(response).toEqual(
            expect.objectContaining({
              CommentTestingIntegerShorthand: {
                type: 'object',
                required: ['howyadoin'],
                properties: {
                  howyadoin: {
                    type: 'integer',
                  },
                },
              },
            }),
          )
        })
      })
    })

    context('with a decimal type passed', () => {
      it('expands to number tpye with decimal format', async () => {
        const renderer = new OpenapiEndpointRenderer(
          () => CommentTestingDecimalSerializer,
          UsersController,
          'howyadoin',
          {},
        )

        const response = await renderer.toSchemaObject()
        expect(response).toEqual(
          expect.objectContaining({
            CommentTestingDecimal: {
              type: 'object',
              required: ['howyadoin'],
              properties: {
                howyadoin: {
                  type: 'number',
                  format: 'decimal',
                  minimum: 10,
                  maximum: 20,
                },
              },
            },
          }),
        )
      })

      context('using decimal shorthand', () => {
        it('expands to number format', async () => {
          const renderer = new OpenapiEndpointRenderer(
            () => CommentTestingDecimalShorthandSerializer,
            UsersController,
            'howyadoin',
            {},
          )

          const response = await renderer.toSchemaObject()
          expect(response).toEqual(
            expect.objectContaining({
              CommentTestingDecimalShorthand: {
                type: 'object',
                required: ['howyadoin'],
                properties: {
                  howyadoin: {
                    type: 'number',
                    format: 'decimal',
                  },
                },
              },
            }),
          )
        })
      })
    })

    context('with a double type passed', () => {
      it('expands to number type with double format', async () => {
        const renderer = new OpenapiEndpointRenderer(
          () => CommentTestingDoubleSerializer,
          UsersController,
          'howyadoin',
          {},
        )

        const response = await renderer.toSchemaObject()
        expect(response).toEqual(
          expect.objectContaining({
            CommentTestingDouble: {
              type: 'object',
              required: ['howyadoin'],
              properties: {
                howyadoin: {
                  type: 'number',
                  format: 'double',
                  minimum: 10,
                  maximum: 20,
                  multipleOf: 2.5,
                },
              },
            },
          }),
        )
      })

      context('using double shorthand', () => {
        it('expands to number type with double format', async () => {
          const renderer = new OpenapiEndpointRenderer(
            () => CommentTestingDoubleShorthandSerializer,
            UsersController,
            'howyadoin',
            {},
          )

          const response = await renderer.toSchemaObject()
          expect(response).toEqual(
            expect.objectContaining({
              CommentTestingDoubleShorthand: {
                type: 'object',
                required: ['howyadoin'],
                properties: {
                  howyadoin: {
                    type: 'number',
                    format: 'double',
                  },
                },
              },
            }),
          )
        })
      })

      context('using double[] shorthand', () => {
        it('expands to array with items of number type with double format', async () => {
          const renderer = new OpenapiEndpointRenderer(
            () => CommentTestingDoubleArrayShorthandSerializer,
            UsersController,
            'howyadoin',
            {},
          )

          const response = await renderer.toSchemaObject()
          expect(response).toEqual(
            expect.objectContaining({
              CommentTestingDoubleArrayShorthand: {
                type: 'object',
                required: ['howyadoin'],
                properties: {
                  howyadoin: {
                    type: 'array',
                    items: {
                      type: 'number',
                      format: 'double',
                    },
                  },
                },
              },
            }),
          )
        })
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
                  format: 'date',
                },
                howyadoins: {
                  type: 'array',
                  items: {
                    type: 'string',
                    format: 'date',
                  },
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
                  format: 'date-time',
                },
                howyadoins: {
                  type: 'array',
                  items: {
                    type: 'string',
                    format: 'date-time',
                  },
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
                  minProperties: 8,
                  maxProperties: 10,
                  properties: {},
                  additionalProperties: {
                    oneOf: [{ type: 'string' }, { type: 'boolean' }],
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
                  anyOf: [{ type: 'string' }, { type: 'boolean' }],
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
                  allOf: [{ type: 'string' }, { type: 'boolean' }],
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
                  oneOf: [{ type: 'string' }, { type: 'boolean' }],
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
                        anyOf: [{ type: 'string' }, { type: 'boolean' }],
                      },
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
                        allOf: [{ type: 'string' }, { type: 'boolean' }],
                      },
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
                        oneOf: [{ type: 'string' }, { type: 'boolean' }],
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
                id: { type: 'string' },
                name: { type: 'object' },
              },
            },
            User: {
              type: 'object',
              required: ['id', 'email', 'name'],
              properties: {
                id: { type: 'string' },
                email: { type: 'string' },
                name: { type: 'string' },
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
                  id: { type: 'string' },
                  email: { type: 'string' },
                  name: { type: 'string' },
                },
              },
            }),
          )
        })

        context('with a schemaDelimeter set', () => {
          it('uses delimeter to specify schema name', async () => {
            const renderer = new OpenapiEndpointRenderer(
              () => AdminUserSerializer,
              UsersController,
              'howyadoin',
            )

            jest.spyOn(OpenapiEndpointRenderer.prototype, 'schemaDelimeter', 'get').mockReturnValue('__')

            const response = await renderer.toSchemaObject()
            expect(response).toEqual(
              expect.objectContaining({
                Admin__AdminUser: {
                  type: 'object',
                  required: ['id', 'name', 'pets'],
                  properties: {
                    id: { type: 'string' },
                    name: { type: 'string' },
                    pets: {
                      type: 'array',
                      items: {
                        $ref: '#/components/schemas/Admin__AdminPetSummary',
                      },
                    },
                  },
                },
                Admin__AdminPetSummary: {
                  type: 'object',
                  required: ['id'],
                  properties: { id: { type: 'string' } },
                },
              }),
            )
          })
        })

        context('with a nullable RendersOne', () => {
          it('treats association as nullable', async () => {
            const renderer = new OpenapiEndpointRenderer(() => User, UsersController, 'howyadoin', {
              serializerKey: 'withRecentPost',
            })

            const response = await renderer.toSchemaObject()
            expect(response).toEqual(
              expect.objectContaining({
                UserWithRecentPost: {
                  type: 'object',
                  required: ['id', 'recentPost'],
                  properties: {
                    id: { type: 'string' },
                    recentPost: {
                      allOf: [{ $ref: '#/components/schemas/PostWithRecentComment' }, { nullable: true }],
                    },
                  },
                },
              }),
            )
          })
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
                    id: { type: 'string' },
                    body: { type: 'string' },
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
                  id: { type: 'string' },
                  body: { type: 'string' },
                  comments: { type: 'array', items: { $ref: '#/components/schemas/Comment' } },
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
                    id: { type: 'string' },
                    body: { type: 'string' },
                  },
                },
              }),
            )
          })
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
                  id: { type: 'string' },
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
