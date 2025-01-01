import { PsychicServer } from '../../../../src'
import OpenapiEndpointRenderer from '../../../../src/openapi-renderer/endpoint'
import * as PsychicApplicationCacheModule from '../../../../src/psychic-application/cache'
import { RouteConfig } from '../../../../src/router/route-manager'
import ApiPetsController from '../../../../test-app/src/app/controllers/Api/PetsController'
import PetsController from '../../../../test-app/src/app/controllers/PetsController'
import UsersController from '../../../../test-app/src/app/controllers/UsersController'
import Pet from '../../../../test-app/src/app/models/Pet'
import Post from '../../../../test-app/src/app/models/Post'
import User from '../../../../test-app/src/app/models/User'
import { CommentTestingDoubleShorthandSerializer } from '../../../../test-app/src/app/serializers/CommentSerializer'
import PostSerializer from '../../../../test-app/src/app/serializers/PostSerializer'
import UserSerializer, {
  UserWithPostsSerializer,
} from '../../../../test-app/src/app/serializers/UserSerializer'
import initializePsychicApplication from '../../../../test-app/src/cli/helpers/initializePsychicApplication'

describe('OpenapiEndpointRenderer', () => {
  let routes: RouteConfig[]
  beforeAll(async () => {
    await initializePsychicApplication()
    const server = new PsychicServer()
    await server.boot()
    routes = await server.routes()
  })

  describe('#toPathObject', () => {
    context('description and summary', () => {
      it('renders provided tags', () => {
        const renderer = new OpenapiEndpointRenderer(User, UsersController, 'howyadoin', {
          description: 'hello',
          summary: 'world',
        })

        const response = renderer.toPathObject({}, routes)
        expect(response).toEqual(
          expect.objectContaining({
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            '/users/howyadoin': expect.objectContaining({
              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
              get: expect.objectContaining({
                description: 'hello',
                summary: 'world',
              }),
            }),
          }),
        )
      })
    })

    context('security', () => {
      it('renders provided security', () => {
        const renderer = new OpenapiEndpointRenderer(User, UsersController, 'howyadoin', {
          security: [{ customToken: [] }],
        })

        const response = renderer.toPathObject({}, routes)
        expect(response).toEqual(
          expect.objectContaining({
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            '/users/howyadoin': expect.objectContaining({
              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
              get: expect.objectContaining({
                security: [{ customToken: [] }],
              }),
            }),
          }),
        )
      })
    })

    context('tags', () => {
      it('renders provided tags', () => {
        const renderer = new OpenapiEndpointRenderer(User, UsersController, 'howyadoin', {
          tags: ['hello', 'world'],
        })

        const response = renderer.toPathObject({}, routes)
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
      it('infers the method by examining routes', () => {
        const renderer = new OpenapiEndpointRenderer(User, UsersController, 'show')

        const response = renderer.toPathObject({}, routes)
        expect(response).toEqual(
          expect.objectContaining({
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            '/users/{id}': expect.objectContaining({
              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
              get: expect.objectContaining({
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                responses: expect.objectContaining({
                  '200': {
                    description: 'Success',
                    content: {
                      'application/json': { schema: { $ref: '#/components/schemas/User' } },
                    },
                  },
                }),
              }),
            }),
          }),
        )
      })
    })

    context('pathParams', () => {
      it('enhances the automatically derived attribute data', () => {
        const renderer = new OpenapiEndpointRenderer(User, UsersController, 'show', {
          pathParams: {
            id: {
              description: 'The ID of the User',
            },
          },
        })

        const response = renderer.toPathObject({}, routes)
        expect(response).toEqual(
          expect.objectContaining({
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            '/users/{id}': expect.objectContaining({
              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
              parameters: expect.arrayContaining([
                {
                  in: 'path',
                  name: 'id',
                  required: true,
                  description: 'The ID of the User',
                  schema: {
                    type: 'string',
                  },
                },
              ]),
            }),
          }),
        )
      })
    })

    context('query', () => {
      it('renders params within the parameters array', () => {
        const renderer = new OpenapiEndpointRenderer(User, UsersController, 'howyadoin', {
          query: {
            search: {
              required: true,
              description: 'the search term',
            },
          },
        })

        const response = renderer.toPathObject({}, routes)
        expect(response).toEqual(
          expect.objectContaining({
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            '/users/howyadoin': expect.objectContaining({
              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
              parameters: expect.arrayContaining([
                {
                  in: 'query',
                  name: 'search',
                  required: true,
                  description: 'the search term',
                  schema: {
                    type: 'string',
                  },
                },
              ]),
            }),
          }),
        )
      })

      context('custom type is provided', () => {
        it('applies override', () => {
          const renderer = new OpenapiEndpointRenderer(User, UsersController, 'howyadoin', {
            query: {
              search: {
                required: true,
                description: 'the search term',
                schema: 'string[]',
              },
            },
          })

          const response = renderer.toPathObject({}, routes)
          expect(response).toEqual(
            expect.objectContaining({
              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
              '/users/howyadoin': expect.objectContaining({
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                parameters: expect.arrayContaining([
                  {
                    in: 'query',
                    name: 'search',
                    required: true,
                    description: 'the search term',
                    schema: {
                      type: 'array',
                      items: {
                        type: 'string',
                      },
                    },
                  },
                ]),
              }),
            }),
          )
        })
      })

      context('allowReserved is overridden', () => {
        it('applies override', () => {
          const renderer = new OpenapiEndpointRenderer(User, UsersController, 'howyadoin', {
            query: {
              search: {
                required: true,
                description: 'the search term',
                allowReserved: false,
              },
            },
          })

          const response = renderer.toPathObject({}, routes)
          expect(response).toEqual(
            expect.objectContaining({
              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
              '/users/howyadoin': expect.objectContaining({
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                parameters: expect.arrayContaining([
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
                ]),
              }),
            }),
          )
        })
      })

      context('allowEmptyValue is overridden', () => {
        it('applies override', () => {
          const renderer = new OpenapiEndpointRenderer(User, UsersController, 'howyadoin', {
            query: {
              search: {
                required: true,
                description: 'the search term',
                allowEmptyValue: true,
              },
            },
          })

          const response = renderer.toPathObject({}, routes)
          expect(response).toEqual(
            expect.objectContaining({
              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
              '/users/howyadoin': expect.objectContaining({
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                parameters: expect.arrayContaining([
                  {
                    in: 'query',
                    name: 'search',
                    required: true,
                    description: 'the search term',
                    schema: {
                      type: 'string',
                    },
                    allowEmptyValue: true,
                  },
                ]),
              }),
            }),
          )
        })
      })
    })

    context('headers', () => {
      it('renders headers within the parameters array', () => {
        const renderer = new OpenapiEndpointRenderer(User, UsersController, 'howyadoin', {
          headers: {
            Authorization: {
              required: true,
              description: 'Auth header',
            },
            today: {
              required: true,
              description: "today's date",
              format: 'date',
            },
          },
        })

        const response = renderer.toPathObject({}, routes)
        expect(response).toEqual(
          expect.objectContaining({
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            '/users/howyadoin': expect.objectContaining({
              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
              parameters: expect.arrayContaining([
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
              ]),
            }),
          }),
        )
      })

      context('config-level header defaults', () => {
        it('renders default headers', () => {
          const renderer = new OpenapiEndpointRenderer(User, UsersController, 'howyadoin', {
            headers: {
              today: {
                required: true,
                description: "today's date",
                format: 'date',
              },
            },
          })

          const response = renderer.toPathObject({}, routes)
          expect(response).toEqual(
            expect.objectContaining({
              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
              '/users/howyadoin': expect.objectContaining({
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                parameters: expect.arrayContaining([
                  {
                    in: 'header',
                    name: 'custom-header',
                    required: true,
                    description: 'custom header',
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
                ]),
              }),
            }),
          )
        })

        context('when default headers are bypassed', () => {
          it('does not render default headers', () => {
            const renderer = new OpenapiEndpointRenderer(User, UsersController, 'howyadoin', {
              headers: {
                today: {
                  required: true,
                  description: "today's date",
                  format: 'date',
                },
              },
              omitDefaultHeaders: true,
            })

            const response = renderer.toPathObject({}, routes)
            expect(response).toEqual(
              expect.objectContaining({
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                '/users/howyadoin': expect.objectContaining({
                  parameters: [
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
        })
      })
    })

    context('requestBody', () => {
      it('renders requestBody in the requestBody payload', () => {
        const renderer = new OpenapiEndpointRenderer(User, UsersController, 'create', {
          requestBody: {
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

        const response = renderer.toPathObject({}, routes)
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
        it('does not provide request body', () => {
          const renderer = new OpenapiEndpointRenderer(User, UsersController, 'show')

          const response = renderer.toPathObject({}, routes)
          expect(response['/users/{id}'].get.requestBody).toBeUndefined()
        })

        context('for a POST http method', () => {
          it('prvoides request body matching the model', () => {
            const renderer = new OpenapiEndpointRenderer(User, UsersController, 'create')

            const response = renderer.toPathObject({}, routes)
            expect(response['/users'].post.requestBody).toEqual(
              expect.objectContaining({
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                      properties: expect.objectContaining({
                        bio: { type: 'string' },
                        birthdate: { type: 'string', format: 'date', nullable: true },
                        createdOn: { type: 'string', format: 'date' },
                        email: { type: 'string' },
                        favoriteBooleans: { type: 'array', items: { type: 'boolean' }, nullable: true },
                        favoriteCitext: { type: 'string', nullable: true },
                        favoriteCitexts: {
                          type: 'array',
                          items: { type: 'string' },
                          nullable: true,
                        },
                        favoriteDates: {
                          type: 'array',
                          items: { type: 'string', format: 'date' },
                          nullable: true,
                        },
                        favoriteDatetimes: {
                          type: 'array',
                          items: { type: 'string', format: 'date-time' },
                          nullable: true,
                        },
                        favoriteIntegers: { type: 'array', items: { type: 'integer' }, nullable: true },
                        favoriteNumerics: {
                          type: 'array',
                          items: { type: 'number' },
                          nullable: true,
                        },
                        favoriteTexts: {
                          type: 'array',
                          items: { type: 'string' },
                          nullable: true,
                        },
                        name: { type: 'string', nullable: true },
                        nicknames: {
                          type: 'array',
                          items: { type: 'string' },
                          nullable: true,
                        },
                        notes: { type: 'string', nullable: true },
                        passwordDigest: { type: 'string' },
                        requiredFavoriteBooleans: { type: 'array', items: { type: 'boolean' } },
                        requiredFavoriteCitext: { type: 'string' },
                        requiredFavoriteCitexts: { type: 'array', items: { type: 'string' } },
                        requiredFavoriteDates: { type: 'array', items: { type: 'string', format: 'date' } },
                        requiredFavoriteDatetimes: {
                          type: 'array',
                          items: { type: 'string', format: 'date-time' },
                        },
                        requiredFavoriteIntegers: { type: 'array', items: { type: 'integer' } },
                        requiredFavoriteNumerics: { type: 'array', items: { type: 'number' } },
                        requiredFavoriteTexts: { type: 'array', items: { type: 'string' } },
                        requiredNicknames: { type: 'array', items: { type: 'string' } },
                      }),
                    },
                  },
                },
              }),
            )
          })

          context('non-standard data types', () => {
            context('bigint', () => {
              it('returns string', () => {
                const renderer = new OpenapiEndpointRenderer(User, UsersController, 'create')

                const response = renderer.toPathObject({}, routes)
                expect(response['/users'].post.requestBody).toEqual(
                  expect.objectContaining({
                    content: {
                      'application/json': {
                        schema: {
                          type: 'object',
                          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                          properties: expect.objectContaining({
                            requiredFavoriteBigint: { type: 'string' },
                          }),
                        },
                      },
                    },
                  }),
                )
              })

              context('bigint[]', () => {
                it('returns string within an array', () => {
                  const renderer = new OpenapiEndpointRenderer(User, UsersController, 'create')

                  const response = renderer.toPathObject({}, routes)
                  expect(response['/users'].post.requestBody).toEqual(
                    expect.objectContaining({
                      content: {
                        'application/json': {
                          schema: {
                            type: 'object',
                            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                            properties: expect.objectContaining({
                              requiredFavoriteBigints: { type: 'array', items: { type: 'string' } },
                            }),
                          },
                        },
                      },
                    }),
                  )
                })
              })
            })

            context('uuid', () => {
              it('returns string', () => {
                const renderer = new OpenapiEndpointRenderer(User, UsersController, 'create')

                const response = renderer.toPathObject({}, routes)
                expect(response['/users'].post.requestBody).toEqual(
                  expect.objectContaining({
                    content: {
                      'application/json': {
                        schema: {
                          type: 'object',
                          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                          properties: expect.objectContaining({
                            uuid: { type: 'string' },
                          }),
                        },
                      },
                    },
                  }),
                )
              })

              context('uuid[]', () => {
                it('returns string within an array', () => {
                  const renderer = new OpenapiEndpointRenderer(User, UsersController, 'create')

                  const response = renderer.toPathObject({}, routes)
                  expect(response['/users'].post.requestBody).toEqual(
                    expect.objectContaining({
                      content: {
                        'application/json': {
                          schema: {
                            type: 'object',
                            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                            properties: expect.objectContaining({
                              favoriteUuids: { type: 'array', items: { type: 'string' }, nullable: true },
                            }),
                          },
                        },
                      },
                    }),
                  )
                })
              })
            })

            context('json', () => {
              it('returns object schema', () => {
                const renderer = new OpenapiEndpointRenderer(User, UsersController, 'create')

                const response = renderer.toPathObject({}, routes)
                expect(response['/users'].post.requestBody).toEqual(
                  expect.objectContaining({
                    content: {
                      'application/json': {
                        schema: {
                          type: 'object',
                          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                          properties: expect.objectContaining({
                            jsonData: { type: 'object', nullable: true },
                          }),
                        },
                      },
                    },
                  }),
                )
              })

              context('json[]', () => {
                it('returns object schema within an array', () => {
                  const renderer = new OpenapiEndpointRenderer(User, UsersController, 'create')

                  const response = renderer.toPathObject({}, routes)
                  expect(response['/users'].post.requestBody).toEqual(
                    expect.objectContaining({
                      content: {
                        'application/json': {
                          schema: {
                            type: 'object',
                            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                            properties: expect.objectContaining({
                              favoriteJsons: { type: 'array', items: { type: 'object' }, nullable: true },
                            }),
                          },
                        },
                      },
                    }),
                  )
                })
              })
            })

            context('jsonb', () => {
              it('returns object schema', () => {
                const renderer = new OpenapiEndpointRenderer(User, UsersController, 'create')

                const response = renderer.toPathObject({}, routes)
                expect(response['/users'].post.requestBody).toEqual(
                  expect.objectContaining({
                    content: {
                      'application/json': {
                        schema: {
                          type: 'object',
                          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                          properties: expect.objectContaining({
                            jsonbData: { type: 'object', nullable: true },
                          }),
                        },
                      },
                    },
                  }),
                )
              })

              context('jsonb[]', () => {
                it('returns object schema within an array', () => {
                  const renderer = new OpenapiEndpointRenderer(User, UsersController, 'create')

                  const response = renderer.toPathObject({}, routes)
                  expect(response['/users'].post.requestBody).toEqual(
                    expect.objectContaining({
                      content: {
                        'application/json': {
                          schema: {
                            type: 'object',
                            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                            properties: expect.objectContaining({
                              favoriteJsonbs: { type: 'array', items: { type: 'object' }, nullable: true },
                            }),
                          },
                        },
                      },
                    }),
                  )
                })
              })
            })

            context('virtual columns', () => {
              it('returns an anyOf statement, allowing all types', () => {
                const renderer = new OpenapiEndpointRenderer(User, UsersController, 'create')

                const response = renderer.toPathObject({}, routes)
                expect(response['/users'].post.requestBody).toEqual(
                  expect.objectContaining({
                    content: {
                      'application/json': {
                        schema: {
                          type: 'object',
                          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                          properties: expect.objectContaining({
                            password: {
                              anyOf: [
                                { type: 'string', nullable: true },
                                { type: 'number', nullable: true },
                                { type: 'object', nullable: true },
                              ],
                            },
                          }),
                        },
                      },
                    },
                  }),
                )
              })

              context('for virtual attributes with explicit types specified', () => {
                it('uses the provided type', () => {
                  const renderer = new OpenapiEndpointRenderer(User, UsersController, 'create')

                  const response = renderer.toPathObject({}, routes)
                  expect(response['/users'].post.requestBody).toEqual(
                    expect.objectContaining({
                      content: {
                        'application/json': {
                          schema: {
                            type: 'object',
                            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                            properties: expect.objectContaining({
                              openapiVirtualSpecTest: {
                                type: 'string',
                                nullable: true,
                              },
                              openapiVirtualSpecTest2: {
                                type: 'array',
                                items: {
                                  type: 'string',
                                },
                              },
                            }),
                          },
                        },
                      },
                    }),
                  )
                })
              })
            })

            context('enums', () => {
              it('renders enums as string with enum option', () => {
                const renderer = new OpenapiEndpointRenderer(Pet, PetsController, 'create')

                const response = renderer.toPathObject({}, routes)
                expect(response['/pets'].post.requestBody).toEqual(
                  expect.objectContaining({
                    content: {
                      'application/json': {
                        schema: {
                          type: 'object',
                          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                          properties: expect.objectContaining({
                            species: { type: 'string', enum: ['cat', 'noncat', 'null'], nullable: true },
                          }),
                        },
                      },
                    },
                  }),
                )
              })

              it('renders enum[] as array with string with enum option', () => {
                const renderer = new OpenapiEndpointRenderer(Pet, PetsController, 'create')

                const response = renderer.toPathObject({}, routes)
                expect(response['/pets'].post.requestBody).toEqual(
                  expect.objectContaining({
                    content: {
                      'application/json': {
                        schema: {
                          type: 'object',
                          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                          properties: expect.objectContaining({
                            favoriteTreats: {
                              type: 'array',
                              items: {
                                type: 'string',
                                enum: ['efishy feesh', 'snick snowcks', 'null'],
                              },
                              nullable: true,
                            },
                          }),
                        },
                      },
                    },
                  }),
                )
              })
            })

            context('suppressResponseEnums=true', () => {
              beforeEach(() => {
                const psychicApp = PsychicApplicationCacheModule.getCachedPsychicApplicationOrFail()
                psychicApp.openapi.default.suppressResponseEnums = true

                jest
                  .spyOn(PsychicApplicationCacheModule, 'getCachedPsychicApplicationOrFail')
                  .mockReturnValue(psychicApp)
              })

              it('does not suppress enums for request bodies', () => {
                const renderer = new OpenapiEndpointRenderer(Pet, PetsController, 'create')

                const response = renderer.toPathObject({}, routes)
                expect(response['/pets'].post.requestBody).toEqual(
                  expect.objectContaining({
                    content: {
                      'application/json': {
                        schema: {
                          type: 'object',
                          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                          properties: expect.objectContaining({
                            favoriteTreats: {
                              type: 'array',
                              items: {
                                type: 'string',
                                enum: ['efishy feesh', 'snick snowcks', 'null'],
                              },
                              nullable: true,
                            },
                          }),
                        },
                      },
                    },
                  }),
                )
              })
            })

            context('requestBody is explicitly set to null', () => {
              it('does not provide requestBody', () => {
                const renderer = new OpenapiEndpointRenderer(Pet, ApiPetsController, 'create', {
                  requestBody: null,
                })

                const response = renderer.toPathObject({}, routes)
                expect(response['/api/pets'].post.requestBody).toBeUndefined()
              })
            })

            context('requestBody leverages only opt', () => {
              it('only renders attributes specified in only array', () => {
                const renderer = new OpenapiEndpointRenderer(Pet, ApiPetsController, 'create', {
                  requestBody: { only: ['species', 'name'] },
                })

                const response = renderer.toPathObject({}, routes)
                expect(response['/api/pets'].post.requestBody).toEqual({
                  content: {
                    'application/json': {
                      schema: {
                        type: 'object',
                        properties: {
                          name: { type: 'string', nullable: true },
                          species: {
                            type: 'string',
                            enum: ['cat', 'noncat', 'null'],
                            nullable: true,
                          },
                        },
                      },
                    },
                  },
                })
              })

              context('requestBody leverages required opt', () => {
                it('renders the required options in the required field', () => {
                  const renderer = new OpenapiEndpointRenderer(Pet, ApiPetsController, 'create', {
                    requestBody: { only: ['species', 'name'], required: ['species'] },
                  })

                  const response = renderer.toPathObject({}, routes)
                  expect(response['/api/pets'].post.requestBody).toEqual({
                    content: {
                      'application/json': {
                        schema: {
                          type: 'object',
                          required: ['species'],
                          properties: {
                            name: { type: 'string', nullable: true },
                            species: {
                              type: 'string',
                              enum: ['cat', 'noncat', 'null'],
                              nullable: true,
                            },
                          },
                        },
                      },
                    },
                  })
                })
              })

              context('requestBody leverages for opt', () => {
                it('uses the model provided in the for option to determine request body shape', () => {
                  const renderer = new OpenapiEndpointRenderer(Pet, ApiPetsController, 'create', {
                    requestBody: { for: User, only: ['email'], required: ['email'] },
                  })

                  const response = renderer.toPathObject({}, routes)
                  expect(response['/api/pets'].post.requestBody).toEqual({
                    content: {
                      'application/json': {
                        schema: {
                          type: 'object',
                          required: ['email'],
                          properties: {
                            email: { type: 'string' },
                          },
                        },
                      },
                    },
                  })
                })
              })
            })
          })
        })

        context('for a PUT http method', () => {
          it('prvoides request body matching the model', () => {
            const renderer = new OpenapiEndpointRenderer(Pet, PetsController, 'update')

            const response = renderer.toPathObject({}, routes)
            expect(response['/pets/{id}'].patch.requestBody).toEqual(
              expect.objectContaining({
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                      properties: expect.objectContaining({
                        collarCount: {
                          nullable: true,
                          type: 'string',
                        },
                      }),
                    },
                  },
                },
              }),
            )
          })
        })
      })
    })

    context('responses', () => {
      context('system-level default responses', () => {
        it('system-level default responses are automatically provided', () => {
          const renderer = new OpenapiEndpointRenderer(User, UsersController, 'howyadoin', {})

          const response = renderer.toPathObject({}, routes)
          expect(response['/users/howyadoin'].get.responses).toEqual(
            expect.objectContaining({
              400: {
                $ref: '#/components/responses/BadRequest',
              },
              422: {
                $ref: '#/components/responses/ValidationErrors',
              },
            }),
          )
        })
      })

      context('config-level default responses', () => {
        it('config-level default responses are automatically provided', () => {
          const renderer = new OpenapiEndpointRenderer(User, UsersController, 'howyadoin', {})

          const response = renderer.toPathObject({}, routes)
          expect(response['/users/howyadoin'].get.responses).toEqual(
            expect.objectContaining({
              490: {
                $ref: '#/components/responses/CustomResponse',
              },
            }),
          )
        })

        context('default responses are explicitly bypassed', () => {
          it('config-level default responses are omitted', () => {
            const renderer = new OpenapiEndpointRenderer(User, UsersController, 'howyadoin', {
              omitDefaultResponses: true,
            })

            const response = renderer.toPathObject({}, routes)
            expect(response['/users/howyadoin'].get.responses).toEqual(
              expect.not.objectContaining({
                490: {
                  $ref: '#/components/responses/CustomResponse',
                },
              }),
            )
          })
        })
      })

      context('with a 204 response specified', () => {
        it('does not render a response payload', () => {
          const renderer = new OpenapiEndpointRenderer(User, UsersController, 'howyadoin', {
            status: 204,
          })

          const response = renderer.toPathObject({}, routes)
          expect(response['/users/howyadoin'].get.responses['200']).toBeUndefined()
          expect(response['/users/howyadoin'].get.responses['204']).toEqual({
            description: 'Success, no content',
            $ref: '#/components/responses/NoContent',
          })
        })
      })

      context('with a default description specified', () => {
        it('renders the default description in the response payload', () => {
          const renderer = new OpenapiEndpointRenderer(User, UsersController, 'howyadoin', {
            status: 204,
            defaultResponse: {
              description: 'World',
            },
            responses: {
              205: {
                type: 'string',
              },
            },
          })

          const response = renderer.toPathObject({}, routes)
          expect(response['/users/howyadoin'].get.responses['200']).toBeUndefined()
          expect(response['/users/howyadoin'].get.responses['204']).toEqual({
            description: 'World',
            $ref: '#/components/responses/NoContent',
          })
          expect(response['/users/howyadoin'].get.responses['205']).toEqual(
            expect.objectContaining({
              content: {
                'application/json': {
                  schema: {
                    type: 'string',
                  },
                },
              },
            }),
          )
        })
      })

      context('with a dream model passed', () => {
        it("uses the corresponding serializer to the dream model and converts it's payload shape to openapi format", () => {
          const renderer = new OpenapiEndpointRenderer(User, UsersController, 'howyadoin', {
            serializerKey: 'extra',
          })

          const response = renderer.toPathObject({}, routes)
          expect(response['/users/howyadoin'].get.responses).toEqual(
            expect.objectContaining({
              200: {
                description: 'Success',
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

        context('when nullable is set to true in the Openapi decorator call', () => {
          it('makes the top level serializer nullable', () => {
            const renderer = new OpenapiEndpointRenderer(User, UsersController, 'howyadoin', {
              serializerKey: 'withRecentPost',
              nullable: true,
            })

            const response = renderer.toPathObject({}, routes)
            expect(response['/users/howyadoin'].get.responses).toEqual(
              expect.objectContaining({
                200: {
                  description: 'Success',
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
      })

      context('with a serializer passed', () => {
        it("uses the provided serializer, converting it's payload shape to openapi format", () => {
          const renderer = new OpenapiEndpointRenderer(
            UserWithPostsSerializer,
            UsersController,
            'howyadoin',
            {},
          )

          const response = renderer.toPathObject({}, routes)
          expect(response['/users/howyadoin'].get.responses).toEqual(
            expect.objectContaining({
              200: {
                description: 'Success',
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
              default: 'UserWithPostsSerializer',
            }
          }
        }

        it("uses the provided serializer, converting it's payload shape to openapi format", () => {
          const renderer = new OpenapiEndpointRenderer(MyViewModel, UsersController, 'howyadoin', {})

          const response = renderer.toPathObject({}, routes)
          expect(response['/users/howyadoin'].get.responses).toEqual(
            expect.objectContaining({
              200: {
                description: 'Success',
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
        it("uses the corresponding serializer to the dream model and converts it's payload shape to openapi format", () => {
          const renderer = new OpenapiEndpointRenderer([User, Post], UsersController, 'howyadoin', {})

          const response = renderer.toPathObject({}, routes)
          expect(response['/users/howyadoin'].get.responses).toEqual(
            expect.objectContaining({
              200: {
                description: 'Success',
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
        it("uses the corresponding serializer to the dream model and converts it's payload shape to openapi format", () => {
          const renderer = new OpenapiEndpointRenderer(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            [UserSerializer, PostSerializer<any, any>],
            UsersController,
            'howyadoin',
            {},
          )

          const response = renderer.toPathObject({}, routes)
          expect(response['/users/howyadoin'].get.responses).toEqual(
            expect.objectContaining({
              200: {
                description: 'Success',
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
        it('returns valid openapi', () => {
          const renderer = new OpenapiEndpointRenderer(User, UsersController, 'howyadoin', {
            serializerKey: 'extra',
            responses: {
              201: {
                description: 'Created',
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

          const response = renderer.toPathObject({}, routes)
          expect(response['/users/howyadoin'].get.responses).toEqual(
            expect.objectContaining({
              201: {
                description: 'Created',
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
          it('returns valid openapi', () => {
            const renderer = new OpenapiEndpointRenderer(User, UsersController, 'howyadoin', {
              serializerKey: 'extra',
              responses: {
                201: {
                  description: 'Created',
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

            const response = renderer.toPathObject({}, routes)
            expect(response['/users/howyadoin'].get.responses).toEqual(
              expect.objectContaining({
                201: {
                  description: 'Created',
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
        it('returns valid openapi', () => {
          const renderer = new OpenapiEndpointRenderer(User, UsersController, 'howyadoin', {
            serializerKey: 'extra',
            responses: {
              201: {
                description: 'Created',
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

          const response = renderer.toPathObject({}, routes)
          expect(response['/users/howyadoin'].get.responses).toEqual(
            expect.objectContaining({
              201: {
                description: 'Created',
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
        it('returns valid openapi', () => {
          const renderer = new OpenapiEndpointRenderer(User, UsersController, 'howyadoin', {
            serializerKey: 'extra',
            responses: {
              201: {
                description: 'Created',
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

          const response = renderer.toPathObject({}, routes)
          expect(response['/users/howyadoin'].get.responses).toEqual(
            expect.objectContaining({
              201: {
                description: 'Created',
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
        it('returns valid openapi', () => {
          const renderer = new OpenapiEndpointRenderer(User, UsersController, 'howyadoin', {
            serializerKey: 'extra',
            responses: {
              201: {
                description: 'Created',
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

          const response = renderer.toPathObject({}, routes)
          expect(response['/users/howyadoin'].get.responses).toEqual(
            expect.objectContaining({
              201: {
                description: 'Created',
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
        it('returns valid openapi', () => {
          const renderer = new OpenapiEndpointRenderer(User, UsersController, 'howyadoin', {
            serializerKey: 'extra',
            status: 201,
            responses: {
              201: {
                $schema: 'Howyadoin',
              },
            },
          })

          const response = renderer.toPathObject({}, routes)
          expect(response['/users/howyadoin'].get.responses).toEqual(
            expect.objectContaining({
              201: {
                description: 'Created',
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

      context('with top-level arguments that should apply to the success response', () => {
        it('applies top-level arguments to the correct response code', () => {
          const renderer = new OpenapiEndpointRenderer(User, UsersController, 'howyadoin', {
            serializerKey: 'extra',
            summary: 'hello',
            description: 'world',
          })

          const response = renderer.toPathObject({}, routes)
          expect(response['/users/howyadoin'].get).toEqual(
            expect.objectContaining({
              summary: 'hello',
              description: 'world',
            }),
          )
        })
      })

      context('with common fields', () => {
        it('returns valid openapi', () => {
          const renderer = new OpenapiEndpointRenderer(User, UsersController, 'howyadoin', {
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

          const response = renderer.toPathObject({}, routes)
          expect(response['/users/howyadoin'].get.responses).toEqual(
            expect.objectContaining({
              201: {
                description: 'Created',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      description: 'my description',
                      summary: 'my summary',
                      nullable: true,
                    },
                  },
                },
              },
            }),
          )
        })
      })

      context('with enum', () => {
        it('returns valid openapi', () => {
          const renderer = new OpenapiEndpointRenderer(User, UsersController, 'howyadoin', {
            serializerKey: 'extra',
            status: 201,
            responses: {
              201: {
                type: 'string',
                enum: ['hello', 'world'],
              },
            },
          })

          const response = renderer.toPathObject({}, routes)
          expect(response['/users/howyadoin'].get.responses).toEqual(
            expect.objectContaining({
              201: {
                description: 'Created',
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

        context('suppressResponseEnums=true', () => {
          beforeEach(() => {
            const psychicApp = PsychicApplicationCacheModule.getCachedPsychicApplicationOrFail()
            psychicApp.openapi.default.suppressResponseEnums = true

            jest
              .spyOn(PsychicApplicationCacheModule, 'getCachedPsychicApplicationOrFail')
              .mockReturnValue(psychicApp)
          })

          it('suppresses enums, instead using description to clarify enum options', () => {
            const renderer = new OpenapiEndpointRenderer(User, UsersController, 'howyadoin', {
              serializerKey: 'extra',
              status: 201,
              responses: {
                201: {
                  type: 'string',
                  enum: ['hello', 'world'],
                },
              },
            })

            const response = renderer.toPathObject({}, routes)
            expect(response['/users/howyadoin'].get.responses).toEqual(
              expect.objectContaining({
                201: {
                  description: 'Created',
                  content: {
                    'application/json': {
                      schema: {
                        type: 'string',
                        description: `
The following values will be allowed:
  hello,
  world`,
                      },
                    },
                  },
                },
              }),
            )
          })
        })
      })

      context('with many=true', () => {
        it("uses the corresponding serializer to the dream model and converts it's payload shape to openapi format", () => {
          const renderer = new OpenapiEndpointRenderer(User, UsersController, 'howyadoin', {
            serializerKey: 'extra',
            many: true,
          })

          const response = renderer.toPathObject({}, routes)
          expect(response['/users/howyadoin'].get.responses).toEqual(
            expect.objectContaining({
              200: {
                description: 'Success',
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
        it('includes extra response payloads', () => {
          const renderer = new OpenapiEndpointRenderer(User, UsersController, 'howyadoin', {
            serializerKey: 'extra',
            status: 201,
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

          const response = renderer.toPathObject({}, routes)
          expect(response['/users/howyadoin'].get.responses).toEqual(
            expect.objectContaining({
              201: {
                description: 'Created',
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
