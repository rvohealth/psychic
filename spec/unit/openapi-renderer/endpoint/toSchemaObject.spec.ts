import { PsychicApp } from '../../../../src/index.js'
import OpenapiEndpointRenderer, {
  ToPathObjectOpts,
  ToSchemaObjectOpts,
} from '../../../../src/openapi-renderer/endpoint.js'
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
import {
  PetWithFavoriteTreatsOverrideSerializer,
  PetWithFavoriteTreatsSerializer,
} from '../../../../test-app/src/app/serializers/PetSerializer.js'
import MyViewModel from '../../../../test-app/src/app/view-models/MyViewModel.js'

describe('OpenapiEndpointRenderer', () => {
  function defaultToPathObjectOpts(): ToPathObjectOpts {
    return {
      openapiName: 'default',
      renderOpts: {
        casing: 'camel',
        suppressResponseEnums: false,
      },
    }
  }

  function defaultToSchemaObjectOpts(opts: Partial<ToSchemaObjectOpts> = {}): ToSchemaObjectOpts {
    return {
      openapiName: 'default',
      renderOpts: {
        casing: 'camel',
        suppressResponseEnums: false,
      },
      alreadyExtractedDescendantSerializers: {},
      renderedSchemasOpenapi: {},
      serializersAppearingInHandWrittenOpenapi: [],
      ...opts,
    }
  }

  describe('#toSchemaObject', () => {
    it("uses the corresponding serializer to the dream model and converts it's payload shape to openapi format", () => {
      const renderer = new OpenapiEndpointRenderer(User, UsersController, 'howyadoin', {
        serializerKey: 'extra',
      })

      const toSchemaObjectOpts = defaultToSchemaObjectOpts()
      renderer.toSchemaObject(toSchemaObjectOpts)

      expect(toSchemaObjectOpts.renderedSchemasOpenapi).toEqual({
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

      const toSchemaObjectOpts = defaultToSchemaObjectOpts()
      renderer.toSchemaObject(toSchemaObjectOpts)

      expect(toSchemaObjectOpts.renderedSchemasOpenapi).toEqual({
        BalloonLatex: {
          properties: {
            color: {
              enum: ['blue', 'green', 'red', null],
              type: ['string', 'null'],
            },
            id: {
              type: 'string',
              format: 'bigint',
            },
            latexOnlyAttr: {
              type: 'string',
            },
          },
          required: ['color', 'id', 'latexOnlyAttr'],
          type: 'object',
        },

        BalloonMylar: {
          properties: {
            color: {
              enum: ['blue', 'green', 'red', null],
              type: ['string', 'null'],
            },
            id: {
              type: 'string',
              format: 'bigint',
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

      const toSchemaObjectOpts = defaultToSchemaObjectOpts()
      renderer.toSchemaObject(toSchemaObjectOpts)

      expect(toSchemaObjectOpts.renderedSchemasOpenapi).toEqual({
        BalloonLatex: {
          properties: {
            color: {
              enum: ['blue', 'green', 'red', null],
              type: ['string', 'null'],
            },
            id: {
              type: 'string',
              format: 'bigint',
            },
            latexOnlyAttr: {
              type: 'string',
            },
          },
          required: ['color', 'id', 'latexOnlyAttr'],
          type: 'object',
        },
        ViewModelsMyViewModel: {
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
        BalloonMylar: {
          properties: {
            color: {
              enum: ['blue', 'green', 'red', null],
              type: ['string', 'null'],
            },
            id: {
              type: 'string',
              format: 'bigint',
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
            customAttributeTest: {
              type: 'string',
            },
            id: {
              type: 'string',
              format: 'bigint',
            },
            name: {
              type: ['string', 'null'],
            },
          },
          required: ['customAttributeTest', 'id', 'name'],
          type: 'object',
        },
      })
    })

    it('does not expand STI children', () => {
      const renderer = new OpenapiEndpointRenderer(BalloonLatex, BalloonsController, 'howyadoin', {
        serializerKey: 'default',
      })
      const toSchemaObjectOpts = defaultToSchemaObjectOpts()
      renderer.toSchemaObject(toSchemaObjectOpts)

      expect(toSchemaObjectOpts.renderedSchemasOpenapi).toEqual({
        BalloonLatex: {
          type: 'object',
          required: ['color', 'id', 'latexOnlyAttr'],
          properties: {
            color: { type: ['string', 'null'], enum: ['blue', 'green', 'red', null] },
            id: { type: 'string', format: 'bigint' },
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

        const toSchemaObjectOpts = defaultToSchemaObjectOpts()
        renderer.toSchemaObject(toSchemaObjectOpts)

        expect(toSchemaObjectOpts.renderedSchemasOpenapi).toEqual(
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
        context('with an object serializer', () => {
          it('suppresses enums, instead using description to clarify enum options', () => {
            const renderer = new OpenapiEndpointRenderer(
              CommentTestingStringSerializer,
              UsersController,
              'howyadoin',
              {},
            )

            const toSchemaObjectOpts = defaultToSchemaObjectOpts({
              renderOpts: { casing: 'camel', suppressResponseEnums: true },
            })
            renderer.toSchemaObject(toSchemaObjectOpts)

            expect(toSchemaObjectOpts.renderedSchemasOpenapi).toEqual(
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

        context('with a dream serializer', () => {
          it('provides the enum values set in the attribute definition', () => {
            const renderer = new OpenapiEndpointRenderer(
              PetWithFavoriteTreatsSerializer,
              UsersController,
              'howyadoin',
              {},
            )

            const toSchemaObjectOpts = defaultToSchemaObjectOpts({
              renderOpts: { casing: 'camel', suppressResponseEnums: true },
            })
            renderer.toSchemaObject(toSchemaObjectOpts)

            expect(toSchemaObjectOpts.renderedSchemasOpenapi).toEqual(
              expect.objectContaining({
                PetWithFavoriteTreats: {
                  type: 'object',
                  required: ['favoriteTreat', 'favoriteTreats'],
                  properties: {
                    favoriteTreats: {
                      type: ['array', 'null'],
                      items: {
                        type: 'string',
                        description:
                          'The following values will be allowed:\n' + '  efishy feesh,\n' + '  snick snowcks',
                      },
                    },
                    favoriteTreat: {
                      type: ['string', 'null'],
                      description:
                        'The following values will be allowed:\n' + '  efishy feesh,\n' + '  snick snowcks',
                    },
                  },
                },
              }),
            )
          })

          context('the enum values are explicitly overridden', () => {
            it('provides the overridden values instead', () => {
              const renderer = new OpenapiEndpointRenderer(
                PetWithFavoriteTreatsOverrideSerializer,
                UsersController,
                'howyadoin',
                {},
              )

              const toSchemaObjectOpts = defaultToSchemaObjectOpts({
                renderOpts: { casing: 'camel', suppressResponseEnums: true },
              })
              renderer.toSchemaObject(toSchemaObjectOpts)

              expect(toSchemaObjectOpts.renderedSchemasOpenapi).toEqual(
                expect.objectContaining({
                  PetWithFavoriteTreatsOverride: {
                    type: 'object',
                    required: ['favoriteTreat', 'favoriteTreats'],
                    properties: {
                      favoriteTreat: {
                        type: ['string', 'null'],
                        description:
                          'The following values will be allowed:\n' +
                          '  overridden field 1,\n' +
                          '  overridden field 2',
                      },
                      favoriteTreats: {
                        type: ['array', 'null'],
                        items: {
                          type: 'string',
                          description:
                            '\n' +
                            'The following values will be allowed:\n' +
                            '  overridden field 1,\n' +
                            '  overridden field 2',
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

    context('with an integer type passed', () => {
      it('supports integer type fields, including minimum and maximum', () => {
        const renderer = new OpenapiEndpointRenderer(
          CommentTestingIntegerSerializer,
          UsersController,
          'howyadoin',
          {},
        )

        const toSchemaObjectOpts = defaultToSchemaObjectOpts()
        renderer.toSchemaObject(toSchemaObjectOpts)

        expect(toSchemaObjectOpts.renderedSchemasOpenapi).toEqual(
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

          const toSchemaObjectOpts = defaultToSchemaObjectOpts()
          renderer.toSchemaObject(toSchemaObjectOpts)

          expect(toSchemaObjectOpts.renderedSchemasOpenapi).toEqual(
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

        const toSchemaObjectOpts = defaultToSchemaObjectOpts()
        renderer.toSchemaObject(toSchemaObjectOpts)

        expect(toSchemaObjectOpts.renderedSchemasOpenapi).toEqual(
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

          const toSchemaObjectOpts = defaultToSchemaObjectOpts()
          renderer.toSchemaObject(toSchemaObjectOpts)

          expect(toSchemaObjectOpts.renderedSchemasOpenapi).toEqual(
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

        const toSchemaObjectOpts = defaultToSchemaObjectOpts()
        renderer.toSchemaObject(toSchemaObjectOpts)

        expect(toSchemaObjectOpts.renderedSchemasOpenapi).toEqual(
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

        const toSchemaObjectOpts = defaultToSchemaObjectOpts()
        renderer.toSchemaObject(toSchemaObjectOpts)

        expect(toSchemaObjectOpts.renderedSchemasOpenapi).toEqual(
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

        const routes = PsychicApp.getOrFail().routesCache
        const pathObjectResponse = renderer.toPathObject(routes, defaultToPathObjectOpts())
        const toSchemaObjectOpts = defaultToSchemaObjectOpts({
          ...pathObjectResponse,
          serializersAppearingInHandWrittenOpenapi: pathObjectResponse.referencedSerializers,
        })
        renderer.toSchemaObject(toSchemaObjectOpts)

        expect(toSchemaObjectOpts.renderedSchemasOpenapi).toEqual(
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

        const toSchemaObjectOpts = defaultToSchemaObjectOpts()
        renderer.toSchemaObject(toSchemaObjectOpts)

        expect(toSchemaObjectOpts.renderedSchemasOpenapi).toEqual(
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

        const toSchemaObjectOpts = defaultToSchemaObjectOpts()
        renderer.toSchemaObject(toSchemaObjectOpts)

        expect(toSchemaObjectOpts.renderedSchemasOpenapi).toEqual(
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
        const toSchemaObjectOpts = defaultToSchemaObjectOpts()
        renderer.toSchemaObject(toSchemaObjectOpts)

        expect(toSchemaObjectOpts.renderedSchemasOpenapi).toEqual(
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
        const toSchemaObjectOpts = defaultToSchemaObjectOpts()
        renderer.toSchemaObject(toSchemaObjectOpts)

        expect(toSchemaObjectOpts.renderedSchemasOpenapi).toEqual(
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
        const toSchemaObjectOpts = defaultToSchemaObjectOpts()
        renderer.toSchemaObject(toSchemaObjectOpts)

        expect(toSchemaObjectOpts.renderedSchemasOpenapi).toEqual(
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
        const toSchemaObjectOpts = defaultToSchemaObjectOpts()
        renderer.toSchemaObject(toSchemaObjectOpts)

        expect(toSchemaObjectOpts.renderedSchemasOpenapi).toEqual(
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
            const toSchemaObjectOpts = defaultToSchemaObjectOpts()
            renderer.toSchemaObject(toSchemaObjectOpts)

            expect(toSchemaObjectOpts.renderedSchemasOpenapi).toEqual(
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
            const toSchemaObjectOpts = defaultToSchemaObjectOpts()
            renderer.toSchemaObject(toSchemaObjectOpts)

            expect(toSchemaObjectOpts.renderedSchemasOpenapi).toEqual(
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
            const toSchemaObjectOpts = defaultToSchemaObjectOpts()
            renderer.toSchemaObject(toSchemaObjectOpts)

            expect(toSchemaObjectOpts.renderedSchemasOpenapi).toEqual(
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
            CommentTestingObjectWithSerializerRefSerializer,
            UsersController,
            'howyadoin',
          )

          const routes = PsychicApp.getOrFail().routesCache
          const pathObjectResponse = renderer.toPathObject(routes, defaultToPathObjectOpts())
          const toSchemaObjectOpts = defaultToSchemaObjectOpts({
            ...pathObjectResponse,
            serializersAppearingInHandWrittenOpenapi: pathObjectResponse.referencedSerializers,
          })
          renderer.toSchemaObject(toSchemaObjectOpts)

          expect(toSchemaObjectOpts.renderedSchemasOpenapi).toEqual({
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

        const toSchemaObjectOpts = defaultToSchemaObjectOpts()
        renderer.toSchemaObject(toSchemaObjectOpts)

        expect(toSchemaObjectOpts.renderedSchemasOpenapi).toEqual(
          expect.objectContaining({
            Pet: {
              type: 'object',
              required: ['customAttributeTest', 'id', 'name'],
              properties: {
                customAttributeTest: { type: 'string' },
                id: { type: 'string', format: 'bigint' },
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
          const toSchemaObjectOpts = defaultToSchemaObjectOpts()
          renderer.toSchemaObject(toSchemaObjectOpts)

          expect(toSchemaObjectOpts.renderedSchemasOpenapi).toEqual(
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

            const toSchemaObjectOpts = defaultToSchemaObjectOpts()
            renderer.toSchemaObject(toSchemaObjectOpts)

            expect(toSchemaObjectOpts.alreadyExtractedDescendantSerializers).toEqual({
              CommentSerializer: true,
              PetWithFlattenedAssociationSerializer: true,
              PostWithCommentsSerializer: true,
              UserWithFlattenedPostSerializer: true,
            })

            expect(toSchemaObjectOpts.renderedSchemasOpenapi).toEqual({
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
                  id: { type: 'string', format: 'bigint' },
                },
              },
              Comment: {
                type: 'object',
                required: ['body', 'id'],
                properties: {
                  body: { type: ['string', 'null'] },
                  id: { type: 'string', format: 'bigint' },
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

            const toSchemaObjectOpts = defaultToSchemaObjectOpts()
            renderer.toSchemaObject(toSchemaObjectOpts)

            expect(toSchemaObjectOpts.renderedSchemasOpenapi).toEqual(
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

            const toSchemaObjectOpts = defaultToSchemaObjectOpts()
            renderer.toSchemaObject(toSchemaObjectOpts)

            expect(toSchemaObjectOpts.renderedSchemasOpenapi).toEqual(
              expect.objectContaining({
                Comment: {
                  type: 'object',
                  required: ['body', 'id'],
                  properties: {
                    body: { type: ['string', 'null'] },
                    id: { type: 'string', format: 'bigint' },
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

          const toSchemaObjectOpts = defaultToSchemaObjectOpts()
          renderer.toSchemaObject(toSchemaObjectOpts)

          expect(toSchemaObjectOpts.renderedSchemasOpenapi).toEqual(
            expect.objectContaining({
              PostWithComments: {
                type: 'object',
                required: ['body', 'comments', 'id'],
                properties: {
                  body: { type: ['string', 'null'] },
                  comments: { type: 'array', items: { $ref: '#/components/schemas/Comment' } },
                  id: { type: 'string', format: 'bigint' },
                },
              },
              Comment: {
                type: 'object',
                required: ['body', 'id'],
                properties: {
                  body: { type: ['string', 'null'] },
                  id: { type: 'string', format: 'bigint' },
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

            const toSchemaObjectOpts = defaultToSchemaObjectOpts()
            renderer.toSchemaObject(toSchemaObjectOpts)

            expect(toSchemaObjectOpts.renderedSchemasOpenapi).toEqual(
              expect.objectContaining({
                Comment: {
                  type: 'object',
                  required: ['body', 'id'],
                  properties: {
                    body: { type: ['string', 'null'] },
                    id: { type: 'string', format: 'bigint' },
                  },
                },
              }),
            )
          })
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

        const routes = PsychicApp.getOrFail().routesCache

        const pathObjectResponse = renderer.toPathObject(routes, defaultToPathObjectOpts())
        const toSchemaObjectOpts = defaultToSchemaObjectOpts({
          ...pathObjectResponse,
          serializersAppearingInHandWrittenOpenapi: pathObjectResponse.referencedSerializers,
        })
        renderer.toSchemaObject(toSchemaObjectOpts)

        expect(toSchemaObjectOpts.renderedSchemasOpenapi).toEqual(
          expect.objectContaining({
            LatexSummary: {
              type: 'object',
              required: ['id', 'latexOnlySummaryAttr'],
              properties: {
                id: { type: 'string', format: 'bigint' },
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
                    $ref: '#/components/schemas/MylarSummary',
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

        const toSchemaObjectOpts = defaultToSchemaObjectOpts({
          renderOpts: { casing: 'camel', suppressResponseEnums: true },
        })
        renderer.toSchemaObject(toSchemaObjectOpts)

        expect(toSchemaObjectOpts.renderedSchemasOpenapi).toEqual({
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

        renderer.toSchemaObject(toSchemaObjectOpts)

        expect(toSchemaObjectOpts.renderedSchemasOpenapi).toEqual({
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
      })
    })
  })
})
