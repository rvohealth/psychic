import { PsychicApp } from '../../../../src/index.js'
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
  CommentTestingDateSerializer,
  CommentTestingDateTimeSerializer,
  CommentTestingDecimalSerializer,
  CommentTestingDecimalShorthandSerializer,
  CommentTestingDefaultNullFieldsSerializer,
  CommentTestingDefaultObjectFieldsSerializer,
  CommentTestingDoubleSerializer,
  CommentTestingIntegerSerializer,
  CommentTestingIntegerShorthandSerializer,
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
  describe('#toSchemaObject', () => {
    it("uses the corresponding serializer to the dream model and converts it's payload shape to openapi format", () => {
      const renderer = new OpenapiEndpointRenderer(User, UsersController, 'howyadoin', {
        serializerKey: 'extra',
      })

      const response = renderer.toSchemaObject({
        casing: 'camel',
        schemaDelimiter: '_',
        openapiName: 'default',
        suppressResponseEnums: false,
        processedSchemas: {},
      })
      expect(response).toEqual({
        UserExtra: {
          type: 'object',
          required: ['id', 'howyadoin', 'nicknames'],
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

      const response = renderer.toSchemaObject({
        casing: 'camel',
        schemaDelimiter: '_',
        processedSchemas: {},
      })
      expect(response).toEqual({
        Latex: {
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
          required: ['id', 'color', 'latexOnlyAttr'],
          type: 'object',
        },

        Mylar: {
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
          required: ['id', 'color', 'mylarOnlyAttr'],
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

      const response = renderer.toSchemaObject({
        casing: 'camel',
        schemaDelimiter: '_',
        processedSchemas: {},
      })
      expect(response).toEqual({
        Latex: {
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
          required: ['id', 'color', 'latexOnlyAttr'],
          type: 'object',
        },
        MyViewModel: {
          properties: {
            favoriteNumber: {
              type: 'number',
            },
            name: {
              type: 'string',
            },
          },
          required: ['name', 'favoriteNumber'],
          type: 'object',
        },
        Mylar: {
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
          required: ['id', 'color', 'mylarOnlyAttr'],
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
      const response = renderer.toSchemaObject({
        casing: 'camel',
        schemaDelimiter: '_',
        processedSchemas: {},
      })
      expect(response).toEqual({
        Latex: {
          type: 'object',
          required: ['id', 'color', 'latexOnlyAttr'],
          properties: {
            id: { type: 'string' },
            color: { type: ['string', 'null'], enum: ['blue', 'green', 'red'] },
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

        const response = renderer.toSchemaObject({
          casing: 'camel',
          schemaDelimiter: '_',
          processedSchemas: {},
        })
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
          const psychicApp = PsychicApp.getOrFail()
          psychicApp.openapi.default!.suppressResponseEnums = true
        })

        it('suppresses enums, instead using description to clarify enum options', () => {
          const renderer = new OpenapiEndpointRenderer(
            CommentTestingStringSerializer,
            UsersController,
            'howyadoin',
            {},
          )

          const response = renderer.toSchemaObject({
            casing: 'camel',
            schemaDelimiter: '_',
            processedSchemas: {},
          })
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

        const response = renderer.toSchemaObject({
          casing: 'camel',
          schemaDelimiter: '_',
          processedSchemas: {},
        })
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

          const response = renderer.toSchemaObject({
            casing: 'camel',
            schemaDelimiter: '_',
            processedSchemas: {},
          })
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

        const response = renderer.toSchemaObject({
          casing: 'camel',
          schemaDelimiter: '_',
          processedSchemas: {},
        })
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

          const response = renderer.toSchemaObject({
            casing: 'camel',
            schemaDelimiter: '_',
            processedSchemas: {},
          })
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

        const response = renderer.toSchemaObject({
          casing: 'camel',
          schemaDelimiter: '_',
          processedSchemas: {},
        })
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
    })

    context('with a date type passed', () => {
      it('supports integer type fields, including minimum and maximum', () => {
        const renderer = new OpenapiEndpointRenderer(
          CommentTestingDateSerializer,
          UsersController,
          'howyadoin',
          {},
        )

        const response = renderer.toSchemaObject({
          casing: 'camel',
          schemaDelimiter: '_',
          processedSchemas: {},
        })
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

        const response = renderer.toSchemaObject({
          casing: 'camel',
          schemaDelimiter: '_',
          processedSchemas: {},
        })
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

    context('with a null type passed', () => {
      it('supports type: null statements', () => {
        const renderer = new OpenapiEndpointRenderer(
          CommentTestingDefaultNullFieldsSerializer,
          UsersController,
          'howyadoin',
          {},
        )

        const response = renderer.toSchemaObject({
          casing: 'camel',
          schemaDelimiter: '_',
          processedSchemas: {},
        })
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

        const response = renderer.toSchemaObject({
          casing: 'camel',
          schemaDelimiter: '_',
          processedSchemas: {},
        })
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
        const response = renderer.toSchemaObject({
          casing: 'camel',
          schemaDelimiter: '_',
          processedSchemas: {},
        })
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
        const response = renderer.toSchemaObject({
          casing: 'camel',
          schemaDelimiter: '_',
          processedSchemas: {},
        })
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
        const response = renderer.toSchemaObject({
          casing: 'camel',
          schemaDelimiter: '_',
          processedSchemas: {},
        })
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
          it('renders anyOf expression', () => {
            const renderer = new OpenapiEndpointRenderer(
              CommentWithAnyOfArraySerializer,
              UsersController,
              'howyadoin',
            )
            const response = renderer.toSchemaObject({
              casing: 'camel',
              schemaDelimiter: '_',
              processedSchemas: {},
            })
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
            const response = renderer.toSchemaObject({
              casing: 'camel',
              schemaDelimiter: '_',
              processedSchemas: {},
            })
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
            const response = renderer.toSchemaObject({
              casing: 'camel',
              schemaDelimiter: '_',
              processedSchemas: {},
            })
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
      it('renders the association as a ref, also providing a schema definition for the associated serializer', () => {
        const renderer = new OpenapiEndpointRenderer([Pet, User], UsersController, 'howyadoin', {
          serializerKey: 'default',
        })

        const response = renderer.toSchemaObject({
          casing: 'camel',
          schemaDelimiter: '_',
          processedSchemas: {},
        })
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
              required: ['id', 'email', 'name'],
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
          const response = renderer.toSchemaObject({
            casing: 'camel',
            schemaDelimiter: '_',
            processedSchemas: {},
          })
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
            const response = renderer.toSchemaObject({
              casing: 'camel',
              schemaDelimiter: '_',
              processedSchemas: {},
            })

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
                    body: { type: ['string', 'null'] },
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
                    body: { type: ['string', 'null'] },
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
                    body: { type: ['string', 'null'] },
                  },
                },
              }),
            )
          })

          context('optional=true', () => {
            it('omits flattened fields from required statement', () => {
              const renderer = new OpenapiEndpointRenderer(User, UsersController, 'howyadoin', {
                serializerKey: 'withOptionalFlattenedPost',
              })
              const response = renderer.toSchemaObject({
                casing: 'camel',
                schemaDelimiter: '_',
                processedSchemas: {},
              })

              expect(response).toEqual(
                expect.objectContaining({
                  UserWithOptionalFlattenedPost: {
                    type: 'object',
                    required: ['id'],
                    properties: {
                      id: { type: 'string' },
                      body: { type: ['string', 'null'] },
                      comments: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/Comment' },
                      },
                    },
                  },
                }),
              )
            })
          })
        })

        context('with an optional RendersOne', () => {
          it('treats association as nullable', () => {
            const renderer = new OpenapiEndpointRenderer(User, UsersController, 'howyadoin', {
              serializerKey: 'withRecentPost',
            })

            const response = renderer.toSchemaObject({
              casing: 'camel',
              schemaDelimiter: '_',
              processedSchemas: {},
            })
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

            const response = renderer.toSchemaObject({
              casing: 'camel',
              schemaDelimiter: '_',
              processedSchemas: {},
            })
            expect(response).toEqual(
              expect.objectContaining({
                Comment: {
                  type: 'object',
                  required: ['id', 'body'],
                  properties: {
                    id: { type: 'string' },
                    body: { type: ['string', 'null'] },
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

          const response = renderer.toSchemaObject({
            casing: 'camel',
            schemaDelimiter: '_',
            processedSchemas: {},
          })
          expect(response).toEqual(
            expect.objectContaining({
              PostWithComments: {
                type: 'object',
                required: ['id', 'body', 'comments'],
                properties: {
                  id: { type: 'string' },
                  body: { type: ['string', 'null'] },
                  comments: { type: 'array', items: { $ref: '#/components/schemas/Comment' } },
                },
              },
              Comment: {
                type: 'object',
                required: ['id', 'body'],
                properties: {
                  id: { type: 'string' },
                  body: { type: ['string', 'null'] },
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

            const response = renderer.toSchemaObject({
              casing: 'camel',
              schemaDelimiter: '_',
              processedSchemas: {},
            })
            expect(response).toEqual(
              expect.objectContaining({
                Comment: {
                  type: 'object',
                  required: ['id', 'body'],
                  properties: {
                    id: { type: 'string' },
                    body: { type: ['string', 'null'] },
                  },
                },
              }),
            )
          })
        })
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
          renderer.toSchemaObject({
            casing: 'camel',
            schemaDelimiter: '_',
            processedSchemas: {},
          }),
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

        expect(
          renderer.toSchemaObject({
            casing: 'camel',
            schemaDelimiter: '_',
            processedSchemas: {},
          }),
        ).toEqual({
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
