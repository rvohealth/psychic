import OpenapiEndpointRenderer from '../../../../src/openapi-renderer/endpoint'
import * as PsychicApplicationCacheModule from '../../../../src/psychic-application/cache'
import UsersController from '../../../../test-app/src/app/controllers/UsersController'
import Pet from '../../../../test-app/src/app/models/Pet'
import Post from '../../../../test-app/src/app/models/Post'
import User from '../../../../test-app/src/app/models/User'
import {
  CommentTestingArrayWithSerializerRefSerializer,
  CommentTestingBasicArraySerializerRefSerializer,
  CommentTestingBasicSerializerRefSerializer,
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
  CommentTestingObjectWithSerializerRefSerializer,
  CommentTestingRootSerializerRefSerializer,
  CommentTestingStringSerializer,
  CommentWithAllOfArraySerializer,
  CommentWithAllOfObjectSerializer,
  CommentWithAnyOfArraySerializer,
  CommentWithAnyOfObjectSerializer,
  CommentWithOneOfArraySerializer,
  CommentWithOneOfObjectSerializer,
} from '../../../../test-app/src/app/serializers/CommentSerializer'
import { UserWithPostsMultiType2Serializer } from '../../../../test-app/src/app/serializers/UserSerializer'

describe('OpenapiEndpointRenderer', () => {
  describe('#toSchemaObject', () => {
    it("uses the corresponding serializer to the dream model and converts it's payload shape to openapi format", () => {
      const renderer = new OpenapiEndpointRenderer(User, UsersController, 'howyadoin', {
        serializerKey: 'extra',
      })

      const response = renderer.toSchemaObject({})
      expect(response).toEqual({
        UserExtra: {
          type: 'object',
          required: ['id', 'nicknames', 'howyadoin'],
          properties: {
            id: {
              type: 'integer',
            },
            nicknames: {
              type: 'array',
              nullable: true,
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

    context('with a string type passed', () => {
      it('supports format and enum fields', () => {
        const renderer = new OpenapiEndpointRenderer(
          CommentTestingStringSerializer,
          UsersController,
          'howyadoin',
          {},
        )

        const response = renderer.toSchemaObject({})
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

      context('suppressResponseEnums=true', () => {
        beforeEach(() => {
          const psychicApp = PsychicApplicationCacheModule.getCachedPsychicApplicationOrFail()
          psychicApp.openapi.suppressResponseEnums = true

          jest
            .spyOn(PsychicApplicationCacheModule, 'getCachedPsychicApplicationOrFail')
            .mockReturnValue(psychicApp)
        })

        it('suppresses enums, instead using description to clarify enum options', () => {
          const renderer = new OpenapiEndpointRenderer(
            CommentTestingStringSerializer,
            UsersController,
            'howyadoin',
            {},
          )

          const response = renderer.toSchemaObject({})
          expect(response).toEqual(
            expect.objectContaining({
              CommentTestingString: {
                type: 'object',
                required: ['howyadoin'],
                properties: {
                  howyadoin: {
                    type: 'string',
                    format: 'date',
                    description: `
The following values will be allowed:
  hello,
  world`,
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
    })

    context('with an integer type passed', () => {
      it('supports integer type fields, including minimum and maximum', () => {
        const renderer = new OpenapiEndpointRenderer(
          CommentTestingIntegerSerializer,
          UsersController,
          'howyadoin',
          {},
        )

        const response = renderer.toSchemaObject({})
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
        it('expands to integer type', () => {
          const renderer = new OpenapiEndpointRenderer(
            CommentTestingIntegerShorthandSerializer,
            UsersController,
            'howyadoin',
            {},
          )

          const response = renderer.toSchemaObject({})
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
      it('expands to number tpye with decimal format', () => {
        const renderer = new OpenapiEndpointRenderer(
          CommentTestingDecimalSerializer,
          UsersController,
          'howyadoin',
          {},
        )

        const response = renderer.toSchemaObject({})
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
        it('expands to number format', () => {
          const renderer = new OpenapiEndpointRenderer(
            CommentTestingDecimalShorthandSerializer,
            UsersController,
            'howyadoin',
            {},
          )

          const response = renderer.toSchemaObject({})
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
      it('expands to number type with double format', () => {
        const renderer = new OpenapiEndpointRenderer(
          CommentTestingDoubleSerializer,
          UsersController,
          'howyadoin',
          {},
        )

        const response = renderer.toSchemaObject({})
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
        it('expands to number type with double format', () => {
          const renderer = new OpenapiEndpointRenderer(
            CommentTestingDoubleShorthandSerializer,
            UsersController,
            'howyadoin',
            {},
          )

          const response = renderer.toSchemaObject({})
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
        it('expands to array with items of number type with double format', () => {
          const renderer = new OpenapiEndpointRenderer(
            CommentTestingDoubleArrayShorthandSerializer,
            UsersController,
            'howyadoin',
            {},
          )

          const response = renderer.toSchemaObject({})
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
      it('supports integer type fields, including minimum and maximum', () => {
        const renderer = new OpenapiEndpointRenderer(
          CommentTestingDateSerializer,
          UsersController,
          'howyadoin',
          {},
        )

        const response = renderer.toSchemaObject({})
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
      it('supports integer type fields, including minimum and maximum', () => {
        const renderer = new OpenapiEndpointRenderer(
          CommentTestingDateTimeSerializer,
          UsersController,
          'howyadoin',
          {},
        )

        const response = renderer.toSchemaObject({})
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

    context('with a $serializer expression passed', () => {
      it('supports an attribute with the $serializer expression', () => {
        const renderer = new OpenapiEndpointRenderer(
          CommentTestingRootSerializerRefSerializer,
          UsersController,
          'howyadoin',
          {},
        )

        const response = renderer.toSchemaObject({})
        expect(response).toEqual(
          expect.objectContaining({
            CommentTestingRootSerializerRef: {
              type: 'object',
              required: [
                'nonNullableHowyadoin',
                'nonNullableHowyadoins',
                'singleHowyadoin',
                'manyHowyadoins',
              ],
              properties: {
                nonNullableHowyadoin: {
                  $ref: '#/components/schemas/CommentTestingDoubleShorthand',
                },
                nonNullableHowyadoins: {
                  type: 'array',
                  items: {
                    $ref: '#/components/schemas/CommentTestingDoubleShorthand',
                  },
                },
                singleHowyadoin: {
                  allOf: [
                    {
                      $ref: '#/components/schemas/CommentTestingDoubleShorthand',
                    },
                    { nullable: true },
                  ],
                },
                manyHowyadoins: {
                  type: 'array',
                  items: {
                    $ref: '#/components/schemas/CommentTestingDoubleShorthand',
                  },
                  nullable: true,
                },
              },
            },
          }),
        )
      })
    })

    context('with an object type passed', () => {
      it('supports maxProperties and additionalProperties fields', () => {
        const renderer = new OpenapiEndpointRenderer(
          CommentTestingDefaultObjectFieldsSerializer,
          UsersController,
          'howyadoin',
          {
            serializerKey: 'default',
          },
        )

        const response = renderer.toSchemaObject({})
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
                  additionalProperties: {
                    oneOf: [{ type: 'string' }, { type: 'boolean' }],
                  },
                },
              },
            },
          }),
        )
      })

      it('supports anyOf expression', () => {
        const renderer = new OpenapiEndpointRenderer(
          CommentWithAnyOfObjectSerializer,
          UsersController,
          'howyadoin',
          {
            serializerKey: 'default',
          },
        )
        const response = renderer.toSchemaObject({})
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

      it('supports allOf expression', () => {
        const renderer = new OpenapiEndpointRenderer(
          CommentWithAllOfObjectSerializer,
          UsersController,
          'howyadoin',
          {
            serializerKey: 'default',
          },
        )
        const response = renderer.toSchemaObject({})
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

      it('supports oneOf expression', () => {
        const renderer = new OpenapiEndpointRenderer(
          CommentWithOneOfObjectSerializer,
          UsersController,
          'howyadoin',
          {
            serializerKey: 'default',
          },
        )
        const response = renderer.toSchemaObject({})
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

      it('supports $serializer expression', () => {
        const renderer = new OpenapiEndpointRenderer(
          CommentTestingObjectWithSerializerRefSerializer,
          UsersController,
          'howyadoin',
          {
            serializerKey: 'default',
          },
        )
        const response = renderer.toSchemaObject({})
        expect(response).toEqual(
          expect.objectContaining({
            CommentTestingObjectWithSerializerRef: {
              type: 'object',
              required: ['howyadoin'],
              properties: {
                howyadoin: {
                  type: 'object',
                  properties: {
                    myProperty: {
                      $ref: '#/components/schemas/CommentTestingDoubleShorthand',
                    },
                    myProperties: {
                      type: 'array',
                      items: {
                        $ref: '#/components/schemas/CommentTestingDoubleShorthand',
                      },
                    },
                    myNullableProperty: {
                      allOf: [
                        {
                          $ref: '#/components/schemas/CommentTestingDoubleShorthand',
                        },
                        { nullable: true },
                      ],
                    },
                    myNullableProperties: {
                      type: 'array',
                      items: {
                        $ref: '#/components/schemas/CommentTestingDoubleShorthand',
                      },
                      nullable: true,
                    },
                  },
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
          it('renders anyOf expression', () => {
            const renderer = new OpenapiEndpointRenderer(
              CommentWithAnyOfArraySerializer,
              UsersController,
              'howyadoin',
              {
                serializerKey: 'default',
              },
            )
            const response = renderer.toSchemaObject({})
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
          it('renders allOf expression', () => {
            const renderer = new OpenapiEndpointRenderer(
              CommentWithAllOfArraySerializer,
              UsersController,
              'howyadoin',
              {
                serializerKey: 'default',
              },
            )
            const response = renderer.toSchemaObject({})
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
          it('renders anyOf expression', () => {
            const renderer = new OpenapiEndpointRenderer(
              CommentWithOneOfArraySerializer,
              UsersController,
              'howyadoin',
              {
                serializerKey: 'default',
              },
            )
            const response = renderer.toSchemaObject({})
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

        it('supports $serializer expression', () => {
          const renderer = new OpenapiEndpointRenderer(
            CommentTestingArrayWithSerializerRefSerializer,
            UsersController,
            'howyadoin',
            {
              serializerKey: 'default',
            },
          )
          const response = renderer.toSchemaObject({})
          expect(response).toEqual(
            expect.objectContaining({
              CommentTestingArrayWithSerializerRef: {
                type: 'object',
                required: ['howyadoins', 'nullableHowyadoins', 'howyadoinsNestedArray'],
                properties: {
                  howyadoins: {
                    type: 'array',
                    items: {
                      $ref: '#/components/schemas/CommentTestingDoubleShorthand',
                    },
                  },
                  nullableHowyadoins: {
                    type: 'array',
                    items: {
                      allOf: [
                        {
                          $ref: '#/components/schemas/CommentTestingDoubleShorthand',
                        },
                        { nullable: true },
                      ],
                    },
                  },
                  howyadoinsNestedArray: {
                    type: 'array',
                    items: {
                      type: 'array',
                      items: {
                        $ref: '#/components/schemas/CommentTestingDoubleShorthand',
                      },
                    },
                  },
                },
              },
              CommentTestingDoubleShorthand: {
                type: 'object',
                required: ['howyadoin'],
                properties: { howyadoin: { type: 'number', format: 'double' } },
              },
            }),
          )
        })
      })
    })

    context('with multiple dream models passed to callback', () => {
      it('renders the association as a ref, also providing a schema definition for the associated serializer', () => {
        const renderer = new OpenapiEndpointRenderer([Pet, User], UsersController, 'howyadoin', {
          serializerKey: 'default',
        })

        const response = renderer.toSchemaObject({})
        expect(response).toEqual(
          expect.objectContaining({
            Pet: {
              type: 'object',
              required: ['id', 'name'],
              properties: {
                id: { type: 'string' },
                name: { type: 'string', nullable: true },
              },
            },
            User: {
              type: 'object',
              required: ['id', 'email', 'name'],
              properties: {
                id: { type: 'integer' },
                email: { type: 'string' },
                name: { type: 'string', nullable: true },
              },
            },
          }),
        )
      })
    })

    context('with a serializer that contains an association', () => {
      context('RendersOne', () => {
        it('renders the association as a ref, also providing a schema definition for the associated serializer', () => {
          const renderer = new OpenapiEndpointRenderer(Pet, UsersController, 'howyadoin', {
            serializerKey: 'withAssociation',
          })
          const response = renderer.toSchemaObject({})
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
                  id: { type: 'integer' },
                  email: { type: 'string' },
                  name: { type: 'string', nullable: true },
                },
              },
            }),
          )
        })

        context('flatten=true', () => {
          it('renders flattened serializers the same as regular serializers', () => {
            const renderer = new OpenapiEndpointRenderer(Pet, UsersController, 'howyadoin', {
              serializerKey: 'withFlattenedAssociation',
            })
            const response = renderer.toSchemaObject({})

            expect(response).toEqual(
              expect.objectContaining({
                PetWithFlattenedAssociation: {
                  type: 'object',
                  required: ['user'],
                  properties: { user: { $ref: '#/components/schemas/UserWithFlattenedPost' } },
                },
                UserWithFlattenedPost: {
                  type: 'object',
                  required: ['id', 'body', 'comments'],
                  properties: {
                    id: { type: 'string' },
                    body: { type: 'string', nullable: true },
                    comments: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Comment' },
                    },
                  },
                },
                PostWithComments: {
                  type: 'object',
                  required: ['id', 'body', 'comments'],
                  properties: {
                    id: { type: 'string' },
                    body: { type: 'string', nullable: true },
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
                    body: { type: 'string', nullable: true },
                  },
                },
              }),
            )
          })
        })

        context('with a nullable RendersOne', () => {
          it('treats association as nullable', () => {
            const renderer = new OpenapiEndpointRenderer(User, UsersController, 'howyadoin', {
              serializerKey: 'withRecentPost',
            })

            const response = renderer.toSchemaObject({})
            expect(response).toEqual(
              expect.objectContaining({
                UserWithRecentPost: {
                  type: 'object',
                  required: ['id', 'recentPost'],
                  properties: {
                    id: { type: 'integer' },
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
          it('provides schema for the nested association', () => {
            const renderer = new OpenapiEndpointRenderer(User, UsersController, 'howyadoin', {
              serializerKey: 'withRecentPost',
            })

            const response = renderer.toSchemaObject({})
            expect(response).toEqual(
              expect.objectContaining({
                Comment: {
                  type: 'object',
                  required: ['id', 'body'],
                  properties: {
                    id: { type: 'string' },
                    body: { type: 'string', nullable: true },
                  },
                },
              }),
            )
          })
        })
      })

      context('RendersMany', () => {
        it('renders the association as an array of $refs, also providing a schema definition for the associated serializer', () => {
          const renderer = new OpenapiEndpointRenderer(Post, UsersController, 'howyadoin', {
            serializerKey: 'withComments',
          })

          const response = renderer.toSchemaObject({})
          expect(response).toEqual(
            expect.objectContaining({
              PostWithComments: {
                type: 'object',
                required: ['id', 'body', 'comments'],
                properties: {
                  id: { type: 'string' },
                  body: { type: 'string', nullable: true },
                  comments: { type: 'array', items: { $ref: '#/components/schemas/Comment' } },
                },
              },
              Comment: {
                type: 'object',
                required: ['id', 'body'],
                properties: {
                  id: { type: 'string' },
                  body: { type: 'string', nullable: true },
                },
              },
            }),
          )
        })

        context('with a nested association', () => {
          it('provides schema for the nested association', () => {
            const renderer = new OpenapiEndpointRenderer(User, UsersController, 'howyadoin', {
              serializerKey: 'withPosts',
            })

            const response = renderer.toSchemaObject({})
            expect(response).toEqual(
              expect.objectContaining({
                Comment: {
                  type: 'object',
                  required: ['id', 'body'],
                  properties: {
                    id: { type: 'string' },
                    body: { type: 'string', nullable: true },
                  },
                },
              }),
            )
          })
        })
      })

      context('rendering an association which contains an array of dreams', () => {
        it('extracts serializers from each dream, then encases expression in an anyOf, wrapping all identified serializers', () => {
          const renderer = new OpenapiEndpointRenderer(
            UserWithPostsMultiType2Serializer,
            UsersController,
            'howyadoin',
            {},
          )

          const response = renderer.toSchemaObject({})
          expect(response).toEqual(
            expect.objectContaining({
              UserWithPostsMultiType2: {
                type: 'object',
                required: ['id', 'posts'],
                properties: {
                  id: { type: 'integer' },
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

    context('when responses includes $serializer refs', () => {
      it('extracts serializers and renders them in components.schemas', () => {
        const renderer = new OpenapiEndpointRenderer(
          CommentTestingBasicSerializerRefSerializer,
          UsersController,
          'howyadoin',
          {
            responses: {
              204: {
                $serializer: CommentTestingBasicArraySerializerRefSerializer,
              },
            },
          },
        )

        const response = renderer.toSchemaObject({})
        expect(response).toEqual(
          expect.objectContaining({
            CommentTestingBasicSerializerRef: {
              type: 'object',
              required: ['howyadoin'],
              properties: {
                howyadoin: { $ref: '#/components/schemas/CommentTestingDoubleShorthand' },
              },
            },
            CommentTestingDoubleShorthand: {
              type: 'object',
              required: ['howyadoin'],
              properties: { howyadoin: { type: 'number', format: 'double' } },
            },
            CommentTestingBasicArraySerializerRef: {
              type: 'object',
              required: ['howyadoin'],
              properties: {
                howyadoin: {
                  type: 'array',
                  items: {
                    $ref: '#/components/schemas/CommentTestingDoubleShorthand',
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
