import { SerializerCasing } from '@rvoh/dream'
import { PsychicServer } from '../../../../src/index.js'
import { SerializerArray } from '../../../../src/openapi-renderer/body-segment.js'
import OpenapiEndpointRenderer from '../../../../src/openapi-renderer/endpoint.js'
import BalloonsController from '../../../../test-app/src/app/controllers/BalloonsController.js'
import OpenapiDecoratorTestController from '../../../../test-app/src/app/controllers/OpenapiDecoratorTestsController.js'
import UsersController from '../../../../test-app/src/app/controllers/UsersController.js'
import Balloon from '../../../../test-app/src/app/models/Balloon.js'
import BalloonLatex from '../../../../test-app/src/app/models/Balloon/Latex.js'
import Pet from '../../../../test-app/src/app/models/Pet.js'
import Post from '../../../../test-app/src/app/models/Post.js'
import User from '../../../../test-app/src/app/models/User.js'
import {
  CommentTestingBasicArraySerializerRefSerializer,
  CommentTestingBasicSerializerRefSerializer,
  CommentTestingDateSerializer,
  CommentTestingDateTimeSerializer,
  CommentTestingDecimalSerializer,
  CommentTestingDecimalShorthandSerializer,
  CommentTestingDefaultNullFieldsSerializer,
  CommentTestingDefaultObjectFieldsSerializer,
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
} from '../../../../test-app/src/app/serializers/CommentSerializer.js'
import MyViewModel from '../../../../test-app/src/app/view-models/MyViewModel.js'

describe('OpenapiEndpointRenderer', () => {
  const defaultToSchemaObjectOpts: {
    openapiName: string
    casing: SerializerCasing
    schemaDelimiter: string
    suppressResponseEnums: boolean
    processedSchemas: Record<string, boolean>
    serializersAppearingInHandWrittenOpenapi: SerializerArray
  } = {
    openapiName: 'default',
    casing: 'camel',
    schemaDelimiter: '_',
    suppressResponseEnums: false,
    processedSchemas: {},
    serializersAppearingInHandWrittenOpenapi: [],
  }

  const defaultToPathObjectOpts: {
    openapiName: string
    casing: SerializerCasing
    schemaDelimiter: string
    suppressResponseEnums: boolean
  } = {
    openapiName: 'default',
    casing: 'camel',
    schemaDelimiter: '_',
    suppressResponseEnums: false,
  }

  describe('#toSchemaObject', () => {
    it("uses the corresponding serializer to the dream model and converts it's payload shape to openapi format", () => {
      const renderer = new OpenapiEndpointRenderer(User, UsersController, 'howyadoin', {
        serializerKey: 'extra',
      })

      const response = renderer.toSchemaObject(defaultToSchemaObjectOpts).renderedSchemas
      expect(response).toEqual({
        UserExtra: {
          type: 'object',
          required: ['howyadoin', 'id', 'nicknames'],
          properties: {
            id: {
              type: 'integer',
            },
            nicknames: {
              type: ['array', 'null'],
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

    it('automatically expands Dream STI base models to the STI child serializer shapes', () => {
      const renderer = new OpenapiEndpointRenderer(Balloon, BalloonsController, 'howyadoin', {
        serializerKey: 'default',
      })

      const response = renderer.toSchemaObject(defaultToSchemaObjectOpts).renderedSchemas
      expect(response).toEqual({
        Balloon_Latex: {
          properties: {
            color: {
              enum: ['blue', 'green', 'red'],
              type: ['string', 'null'],
            },
            id: {
              type: 'string',
            },
            latexOnlyAttr: {
              type: 'string',
            },
          },
          required: ['color', 'id', 'latexOnlyAttr'],
          type: 'object',
        },

        Balloon_Mylar: {
          properties: {
            color: {
              enum: ['blue', 'green', 'red'],
              type: ['string', 'null'],
            },
            id: {
              type: 'string',
            },
            mylarOnlyAttr: {
              type: 'string',
            },
          },
          required: ['color', 'id', 'mylarOnlyAttr'],
          type: 'object',
        },
      })
    })

    it('automatically expands a combination of STI base model, Dream model, and view model', () => {
      const renderer = new OpenapiEndpointRenderer(
        [Balloon, Pet, MyViewModel],
        BalloonsController,
        'howyadoin',
        {
          serializerKey: 'default',
        },
      )

      const response = renderer.toSchemaObject(defaultToSchemaObjectOpts).renderedSchemas
      expect(response).toEqual({
        Balloon_Latex: {
          properties: {
            color: {
              enum: ['blue', 'green', 'red'],
              type: ['string', 'null'],
            },
            id: {
              type: 'string',
            },
            latexOnlyAttr: {
              type: 'string',
            },
          },
          required: ['color', 'id', 'latexOnlyAttr'],
          type: 'object',
        },
        ViewModels_MyViewModel: {
          properties: {
            favoriteNumber: {
              type: ['number', 'null'],
            },
            name: {
              type: ['string', 'null'],
            },
          },
          required: ['favoriteNumber', 'name'],
          type: 'object',
        },
        Balloon_Mylar: {
          properties: {
            color: {
              enum: ['blue', 'green', 'red'],
              type: ['string', 'null'],
            },
            id: {
              type: 'string',
            },
            mylarOnlyAttr: {
              type: 'string',
            },
          },
          required: ['color', 'id', 'mylarOnlyAttr'],
          type: 'object',
        },

        Pet: {
          properties: {
            id: {
              type: 'string',
            },
            name: {
              type: ['string', 'null'],
            },
          },
          required: ['id', 'name'],
          type: 'object',
        },
      })
    })

    it('does not expand STI children', () => {
      const renderer = new OpenapiEndpointRenderer(BalloonLatex, BalloonsController, 'howyadoin', {
        serializerKey: 'default',
      })
      const response = renderer.toSchemaObject(defaultToSchemaObjectOpts).renderedSchemas
      expect(response).toEqual({
        Balloon_Latex: {
          type: 'object',
          required: ['color', 'id', 'latexOnlyAttr'],
          properties: {
            color: { type: ['string', 'null'], enum: ['blue', 'green', 'red'] },
            id: { type: 'string' },
            latexOnlyAttr: { type: 'string' },
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

        const response = renderer.toSchemaObject(defaultToSchemaObjectOpts).renderedSchemas
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
        it('suppresses enums, instead using description to clarify enum options', () => {
          const renderer = new OpenapiEndpointRenderer(
            CommentTestingStringSerializer,
            UsersController,
            'howyadoin',
            {},
          )

          const response = renderer.toSchemaObject({
            ...defaultToSchemaObjectOpts,
            suppressResponseEnums: true,
          }).renderedSchemas

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

        const response = renderer.toSchemaObject(defaultToSchemaObjectOpts).renderedSchemas
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

          const response = renderer.toSchemaObject(defaultToSchemaObjectOpts).renderedSchemas
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

        const response = renderer.toSchemaObject(defaultToSchemaObjectOpts).renderedSchemas
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

          const response = renderer.toSchemaObject(defaultToSchemaObjectOpts).renderedSchemas
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

    context('with a date type passed', () => {
      it('supports integer type fields, including minimum and maximum', () => {
        const renderer = new OpenapiEndpointRenderer(
          CommentTestingDateSerializer,
          UsersController,
          'howyadoin',
          {},
        )

        const response = renderer.toSchemaObject(defaultToSchemaObjectOpts).renderedSchemas
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

        const response = renderer.toSchemaObject(defaultToSchemaObjectOpts).renderedSchemas
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
      it('supports an attribute with the $serializer expression', async () => {
        const renderer = new OpenapiEndpointRenderer(
          CommentTestingRootSerializerRefSerializer,
          UsersController,
          'howyadoin',
          {},
        )

        const server = new PsychicServer()
        await server.boot()
        const routes = await server.routes()

        const pathObjectResponse = renderer.toPathObject(routes, defaultToPathObjectOpts)

        const response = renderer.toSchemaObject({
          ...defaultToSchemaObjectOpts,
          serializersAppearingInHandWrittenOpenapi: pathObjectResponse.referencedSerializers,
        }).renderedSchemas

        expect(response).toEqual(
          expect.objectContaining({
            CommentTestingRootSerializerRef: {
              type: 'object',
              required: [
                'manyHowyadoins',
                'nonNullableHowyadoin',
                'nonNullableHowyadoins',
                'singleHowyadoin',
              ],
              properties: {
                nonNullableHowyadoin: {
                  $ref: '#/components/schemas/CommentTestingDecimalShorthand',
                },
                nonNullableHowyadoins: {
                  type: 'array',
                  items: {
                    $ref: '#/components/schemas/CommentTestingDecimalShorthand',
                  },
                },
                singleHowyadoin: {
                  anyOf: [
                    {
                      $ref: '#/components/schemas/CommentTestingDecimalShorthand',
                    },
                    { type: 'null' },
                  ],
                },
                manyHowyadoins: {
                  type: ['array', 'null'],
                  items: {
                    $ref: '#/components/schemas/CommentTestingDecimalShorthand',
                  },
                },
              },
            },
          }),
        )
      })
    })

    context('with a null type passed', () => {
      it('supports type: null statements', () => {
        const renderer = new OpenapiEndpointRenderer(
          CommentTestingDefaultNullFieldsSerializer,
          UsersController,
          'howyadoin',
          {},
        )

        const response = renderer.toSchemaObject(defaultToSchemaObjectOpts).renderedSchemas
        expect(response).toEqual(
          expect.objectContaining({
            CommentTestingDefaultNullFields: {
              type: 'object',
              required: ['howyadoin'],
              properties: {
                howyadoin: {
                  oneOf: [{ type: 'null' }, { type: 'string' }],
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
        )

        const response = renderer.toSchemaObject(defaultToSchemaObjectOpts).renderedSchemas
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
        )
        const response = renderer.toSchemaObject(defaultToSchemaObjectOpts).renderedSchemas
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
        )
        const response = renderer.toSchemaObject(defaultToSchemaObjectOpts).renderedSchemas
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
        )
        const response = renderer.toSchemaObject(defaultToSchemaObjectOpts).renderedSchemas
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

      it('supports $ref expression', () => {
        const renderer = new OpenapiEndpointRenderer(
          CommentTestingObjectWithSerializerRefSerializer,
          UsersController,
          'howyadoin',
        )
        const response = renderer.toSchemaObject(defaultToSchemaObjectOpts).renderedSchemas
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
                      $ref: '#/components/schemas/CommentTestingDecimalShorthand',
                    },
                    myProperties: {
                      type: 'array',
                      items: {
                        $ref: '#/components/schemas/CommentTestingDecimalShorthand',
                      },
                    },
                    myNullableProperty: {
                      anyOf: [
                        {
                          $ref: '#/components/schemas/CommentTestingDecimalShorthand',
                        },
                        { type: 'null' },
                      ],
                    },
                    myNullableProperties: {
                      type: ['array', 'null'],
                      items: {
                        $ref: '#/components/schemas/CommentTestingDecimalShorthand',
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

    context('with an array type passed', () => {
      context('items on the array or leveraging an expression', () => {
        context('anyOf', () => {
          it('renders anyOf expression', () => {
            const renderer = new OpenapiEndpointRenderer(
              CommentWithAnyOfArraySerializer,
              UsersController,
              'howyadoin',
            )
            const response = renderer.toSchemaObject(defaultToSchemaObjectOpts).renderedSchemas
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
            )
            const response = renderer.toSchemaObject(defaultToSchemaObjectOpts).renderedSchemas
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
            )
            const response = renderer.toSchemaObject(defaultToSchemaObjectOpts).renderedSchemas
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

        it('supports $serializer expression', async () => {
          const renderer = new OpenapiEndpointRenderer(
            CommentTestingObjectWithSerializerRefSerializer,
            UsersController,
            'howyadoin',
          )

          const server = new PsychicServer()
          await server.boot()
          const routes = await server.routes()

          const pathObjectResponse = renderer.toPathObject(routes, defaultToPathObjectOpts)
          const response = renderer.toSchemaObject({
            ...defaultToSchemaObjectOpts,
            serializersAppearingInHandWrittenOpenapi: pathObjectResponse.referencedSerializers,
          }).renderedSchemas

          expect(response).toEqual({
            CommentTestingDecimalShorthand: {
              properties: {
                howyadoin: {
                  format: 'decimal',
                  type: 'number',
                },
              },
              required: ['howyadoin'],
              type: 'object',
            },

            CommentTestingObjectWithSerializerRef: {
              type: 'object',
              required: ['howyadoin'],
              properties: {
                howyadoin: {
                  type: 'object',
                  properties: {
                    myProperty: {
                      $ref: '#/components/schemas/CommentTestingDecimalShorthand',
                    },
                    myProperties: {
                      type: 'array',
                      items: {
                        $ref: '#/components/schemas/CommentTestingDecimalShorthand',
                      },
                    },
                    myNullableProperty: {
                      anyOf: [
                        {
                          $ref: '#/components/schemas/CommentTestingDecimalShorthand',
                        },
                        { type: 'null' },
                      ],
                    },
                    myNullableProperties: {
                      type: ['array', 'null'],
                      items: {
                        $ref: '#/components/schemas/CommentTestingDecimalShorthand',
                      },
                    },
                  },
                },
              },
            },
          })
        })
      })
    })

    context('with multiple dream models passed to callback', () => {
      it('renders the association as a ref, also providing a schema definition for the associated serializer', () => {
        const renderer = new OpenapiEndpointRenderer([Pet, User], UsersController, 'howyadoin', {
          serializerKey: 'default',
        })

        const response = renderer.toSchemaObject(defaultToSchemaObjectOpts).renderedSchemas
        expect(response).toEqual(
          expect.objectContaining({
            Pet: {
              type: 'object',
              required: ['id', 'name'],
              properties: {
                id: { type: 'string' },
                name: { type: ['string', 'null'] },
              },
            },
            User: {
              type: 'object',
              required: ['email', 'id', 'name'],
              properties: {
                id: { type: 'integer' },
                email: { type: 'string' },
                name: { type: ['string', 'null'] },
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
          const response = renderer.toSchemaObject(defaultToSchemaObjectOpts).renderedSchemas
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
                required: ['email', 'id', 'name'],
                properties: {
                  email: { type: 'string' },
                  id: { type: 'integer' },
                  name: { type: ['string', 'null'] },
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
            const response = renderer.toSchemaObject(defaultToSchemaObjectOpts)

            expect(response.processedSchemas).toEqual({
              CommentSerializer: true,
              PetWithFlattenedAssociationSerializer: true,
              PostWithCommentsSerializer: true,
              UserWithFlattenedPostSerializer: true,
            })

            expect(response.renderedSchemas).toEqual({
              PetWithFlattenedAssociation: {
                type: 'object',
                required: ['user'],
                properties: { user: { $ref: '#/components/schemas/UserWithFlattenedPost' } },
              },
              UserWithFlattenedPost: {
                allOf: [
                  {
                    type: 'object',
                    required: ['id'],
                    properties: {
                      id: { type: 'integer' },
                    },
                  },
                  {
                    $ref: '#/components/schemas/PostWithComments',
                  },
                ],
              },
              PostWithComments: {
                type: 'object',
                required: ['body', 'comments', 'id'],
                properties: {
                  body: { type: ['string', 'null'] },
                  comments: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/Comment' },
                  },
                  id: { type: 'string' },
                },
              },
              Comment: {
                type: 'object',
                required: ['body', 'id'],
                properties: {
                  body: { type: ['string', 'null'] },
                  id: { type: 'string' },
                },
              },
            })
          })
        })

        context('with an optional RendersOne', () => {
          it('treats association as nullable', () => {
            const renderer = new OpenapiEndpointRenderer(User, UsersController, 'howyadoin', {
              serializerKey: 'withRecentPost',
            })

            const response = renderer.toSchemaObject(defaultToSchemaObjectOpts).renderedSchemas
            expect(response).toEqual(
              expect.objectContaining({
                UserWithRecentPost: {
                  type: 'object',
                  required: ['id', 'recentPost'],
                  properties: {
                    id: { type: 'integer' },
                    recentPost: {
                      anyOf: [{ $ref: '#/components/schemas/PostWithRecentComment' }, { type: 'null' }],
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

            const response = renderer.toSchemaObject(defaultToSchemaObjectOpts).renderedSchemas
            expect(response).toEqual(
              expect.objectContaining({
                Comment: {
                  type: 'object',
                  required: ['body', 'id'],
                  properties: {
                    body: { type: ['string', 'null'] },
                    id: { type: 'string' },
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

          const response = renderer.toSchemaObject(defaultToSchemaObjectOpts).renderedSchemas
          expect(response).toEqual(
            expect.objectContaining({
              PostWithComments: {
                type: 'object',
                required: ['body', 'comments', 'id'],
                properties: {
                  body: { type: ['string', 'null'] },
                  comments: { type: 'array', items: { $ref: '#/components/schemas/Comment' } },
                  id: { type: 'string' },
                },
              },
              Comment: {
                type: 'object',
                required: ['body', 'id'],
                properties: {
                  body: { type: ['string', 'null'] },
                  id: { type: 'string' },
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

            const response = renderer.toSchemaObject(defaultToSchemaObjectOpts).renderedSchemas

            expect(response).toEqual(
              expect.objectContaining({
                Comment: {
                  type: 'object',
                  required: ['body', 'id'],
                  properties: {
                    body: { type: ['string', 'null'] },
                    id: { type: 'string' },
                  },
                },
              }),
            )
          })
        })
      })
    })

    context('when responses includes $serializer refs', () => {
      it('extracts serializers and renders them in components.schemas', async () => {
        const renderer = new OpenapiEndpointRenderer(
          CommentTestingBasicSerializerRefSerializer,
          UsersController,
          'howyadoin',
          {
            responses: {
              204: {
                type: 'object',
                properties: {
                  comment1: {
                    $serializer: CommentTestingBasicArraySerializerRefSerializer,
                  },
                  comment2: {
                    $serializer: CommentTestingDateSerializer,
                  },
                },
              },
            },
          },
        )

        const server = new PsychicServer()
        await server.boot()
        const routes = await server.routes()

        const pathObjectResponse = renderer.toPathObject(routes, defaultToPathObjectOpts)

        const response = renderer.toSchemaObject({
          ...defaultToSchemaObjectOpts,
          serializersAppearingInHandWrittenOpenapi: pathObjectResponse.referencedSerializers,
        }).renderedSchemas

        expect(response).toEqual(
          expect.objectContaining({
            Balloon_LatexSummary: {
              type: 'object',
              required: ['id', 'latexOnlySummaryAttr'],
              properties: {
                id: { type: 'string' },
                latexOnlySummaryAttr: {
                  type: 'string',
                },
              },
            },

            CommentTestingDate: {
              type: 'object',
              required: ['howyadoin', 'howyadoins'],
              properties: {
                howyadoin: { type: 'string', format: 'date' },
                howyadoins: { type: 'array', items: { type: 'string', format: 'date' } },
              },
            },

            CommentTestingBasicArraySerializerRef: {
              type: 'object',
              required: ['howyadoin'],
              properties: {
                howyadoin: {
                  type: 'array',
                  items: {
                    $ref: '#/components/schemas/Balloon_MylarSummary',
                  },
                },
              },
            },
          }),
        )
      })
    })

    context('when a controller contains multiple openapiNames', () => {
      it('renders spec for the given openapiName', () => {
        let renderer = new OpenapiEndpointRenderer(
          CommentTestingStringSerializer,
          OpenapiDecoratorTestController,
          'testMultipleOpenapiNames',
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
          {
            status: 200,
            serializerKey: 'mobile',
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } as any,
        )

        expect(
          renderer.toSchemaObject({ ...defaultToSchemaObjectOpts, suppressResponseEnums: true })
            .renderedSchemas,
        ).toEqual({
          CommentTestingString: {
            type: 'object',
            required: ['howyadoin'],
            properties: {
              howyadoin: {
                type: 'string',
                format: 'date',
                pattern: '/^helloworld$/',
                minLength: 2,
                maxLength: 4,
                description: '\nThe following values will be allowed:\n  hello,\n  world',
              },
            },
          },
        })

        renderer = new OpenapiEndpointRenderer(
          CommentTestingStringSerializer,
          OpenapiDecoratorTestController,
          'testMultipleOpenapiNames',
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
          {
            status: 200,
            serializerKey: 'admin',
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } as any,
        )

        expect(renderer.toSchemaObject(defaultToSchemaObjectOpts).renderedSchemas).toEqual({
          CommentTestingString: {
            type: 'object',
            required: ['howyadoin'],
            properties: {
              howyadoin: {
                type: 'string',
                enum: ['hello', 'world'],
                format: 'date',
                pattern: '/^helloworld$/',
                minLength: 2,
                maxLength: 4,
              },
            },
          },
        })
      })
    })
  })
})
