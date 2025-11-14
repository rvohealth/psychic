/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import OpenapiEndpointRenderer, { ToPathObjectOpts } from '../../../../src/openapi-renderer/endpoint.js'
import PsychicApp from '../../../../src/psychic-app/index.js'
import { RouteConfig } from '../../../../src/router/route-manager.js'
import ApiPetsController from '../../../../test-app/src/app/controllers/Api/PetsController.js'
import BalloonsController from '../../../../test-app/src/app/controllers/BalloonsController.js'
import OpenapiOverridesTestController from '../../../../test-app/src/app/controllers/OpenapiOverridesTestsController.js'
import PetsController from '../../../../test-app/src/app/controllers/PetsController.js'
import UsersController from '../../../../test-app/src/app/controllers/UsersController.js'
import Balloon from '../../../../test-app/src/app/models/Balloon.js'
import Pet from '../../../../test-app/src/app/models/Pet.js'
import Post from '../../../../test-app/src/app/models/Post.js'
import User from '../../../../test-app/src/app/models/User.js'
import {
  CommentTestingDecimalShorthandSerializer,
  CommentTestingStringSerializer,
} from '../../../../test-app/src/app/serializers/CommentSerializer.js'
import PostSerializer from '../../../../test-app/src/app/serializers/PostSerializer.js'
import UserSerializer, {
  UserWithPostsSerializer,
} from '../../../../test-app/src/app/serializers/UserSerializer.js'

describe('OpenapiEndpointRenderer', () => {
  let routes: RouteConfig[]

  function defaultToPathObjectOpts(opts: Partial<ToPathObjectOpts> = {}): ToPathObjectOpts {
    return {
      openapiName: 'default',
      renderOpts: {
        casing: 'camel',
        suppressResponseEnums: false,
      },
      ...opts,
    }
  }

  beforeEach(() => {
    routes = PsychicApp.getOrFail().routesCache
  })

  describe('#toPathObject', () => {
    context('description and summary', () => {
      it('renders provided tags', () => {
        const renderer = new OpenapiEndpointRenderer(User, UsersController, 'howyadoin', {
          description: 'hello',
          summary: 'world',
        })

        const response = renderer.toPathObject(routes, defaultToPathObjectOpts()).openapi
        expect(response).toEqual(
          expect.objectContaining({
            '/users/howyadoin': expect.objectContaining({
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

        const response = renderer.toPathObject(routes, defaultToPathObjectOpts()).openapi
        expect(response).toEqual(
          expect.objectContaining({
            '/users/howyadoin': expect.objectContaining({
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

        const response = renderer.toPathObject(routes, defaultToPathObjectOpts()).openapi
        expect(response).toEqual(
          expect.objectContaining({
            '/users/howyadoin': expect.objectContaining({
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

        const response = renderer.toPathObject(routes, defaultToPathObjectOpts()).openapi
        expect(response).toEqual(
          expect.objectContaining({
            '/users/{id}': expect.objectContaining({
              get: expect.objectContaining({
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

        const response = renderer.toPathObject(routes, defaultToPathObjectOpts()).openapi
        expect(response).toEqual(
          expect.objectContaining({
            '/users/{id}': expect.objectContaining({
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
      it('renders params within the parameters array, automatically applying allowReserved: true', () => {
        const renderer = new OpenapiEndpointRenderer(User, UsersController, 'howyadoin', {
          query: {
            search: {
              required: true,
              description: 'the search term',
            },
          },
        })

        const response = renderer.toPathObject(routes, defaultToPathObjectOpts()).openapi
        expect(response).toEqual(
          expect.objectContaining({
            '/users/howyadoin': expect.objectContaining({
              parameters: expect.arrayContaining([
                {
                  in: 'query',
                  name: 'search',
                  required: true,
                  allowReserved: true,
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

      context('pagination', () => {
        context('paginate=true', () => {
          it('adds query page param to openapi spec and a request body reflecting the Dream.paginate response shape', () => {
            const renderer = new OpenapiEndpointRenderer(User, UsersController, 'paginated', {
              paginate: true,
            })

            const response = renderer.toPathObject(routes, defaultToPathObjectOpts()).openapi
            expect(response).toEqual(
              expect.objectContaining({
                '/users/paginated': expect.objectContaining({
                  parameters: expect.arrayContaining([
                    {
                      in: 'query',
                      name: 'page',
                      required: false,
                      allowReserved: true,
                      description: 'Page number',
                      schema: {
                        type: 'string',
                      },
                    },
                  ]),

                  get: expect.objectContaining({
                    responses: expect.objectContaining({
                      200: {
                        content: {
                          'application/json': {
                            schema: {
                              type: 'object',
                              required: ['recordCount', 'pageCount', 'currentPage', 'results'],
                              properties: {
                                recordCount: { type: 'number' },
                                pageCount: { type: 'number' },
                                currentPage: { type: 'number' },
                                results: {
                                  type: 'array',
                                  items: { $ref: '#/components/schemas/User' },
                                },
                              },
                            },
                          },
                        },
                        description: 'Success',
                      },
                    }),
                  }),
                }),
              }),
            )
          })

          context('an STI base model', () => {
            it('the OpenAPI shape includes the children', () => {
              const renderer = new OpenapiEndpointRenderer(Balloon, BalloonsController, 'paginated', {
                paginate: true,
              })

              const response = renderer.toPathObject(routes, defaultToPathObjectOpts()).openapi
              expect(response).toEqual(
                expect.objectContaining({
                  '/balloons/paginated': expect.objectContaining({
                    parameters: expect.arrayContaining([
                      {
                        in: 'query',
                        name: 'page',
                        required: false,
                        allowReserved: true,
                        description: 'Page number',
                        schema: {
                          type: 'string',
                        },
                      },
                    ]),

                    get: expect.objectContaining({
                      responses: expect.objectContaining({
                        200: {
                          content: {
                            'application/json': {
                              schema: {
                                type: 'object',
                                required: ['recordCount', 'pageCount', 'currentPage', 'results'],
                                properties: {
                                  recordCount: { type: 'number' },
                                  pageCount: { type: 'number' },
                                  currentPage: { type: 'number' },
                                  results: {
                                    type: 'array',
                                    items: {
                                      anyOf: [
                                        {
                                          $ref: '#/components/schemas/BalloonLatex',
                                        },
                                        {
                                          $ref: '#/components/schemas/BalloonMylar',
                                        },
                                      ],
                                    },
                                  },
                                },
                              },
                            },
                          },
                          description: 'Success',
                        },
                      }),
                    }),
                  }),
                }),
              )
            })
          })
        })

        context('paginate={ query: "<some-string>" }', () => {
          it('customizes the query cursor param', () => {
            const renderer = new OpenapiEndpointRenderer(User, UsersController, 'paginated', {
              paginate: { query: 'pag' },
            })

            const response = renderer.toPathObject(routes, defaultToPathObjectOpts()).openapi
            expect(response).toEqual(
              expect.objectContaining({
                '/users/paginated': expect.objectContaining({
                  parameters: expect.arrayContaining([
                    {
                      in: 'query',
                      name: 'pag',
                      required: false,
                      allowReserved: true,
                      description: 'Page number',
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

        context('paginate={ body: "page" }', () => {
          it('omits the query param and adds requestBody cursor param to openapi spec', () => {
            const renderer = new OpenapiEndpointRenderer(User, UsersController, 'paginatedPost', {
              paginate: { body: 'page' },
            })

            const response = renderer.toPathObject(routes, defaultToPathObjectOpts()).openapi
            expect(response).toEqual(
              expect.objectContaining({
                '/users/paginated-post': expect.objectContaining({
                  parameters: expect.arrayContaining([
                    expect.not.objectContaining({
                      in: 'query',
                      name: 'page',
                    }),
                  ]),

                  post: expect.objectContaining({
                    requestBody: expect.objectContaining({
                      content: expect.objectContaining({
                        'application/json': expect.objectContaining({
                          schema: expect.objectContaining({
                            properties: expect.objectContaining({
                              page: {
                                type: 'integer',
                                description: 'Page number',
                              },
                            }),
                          }),
                        }),
                      }),
                    }),
                  }),
                }),
              }),
            )
          })

          context('without a model', () => {
            it('adds requestBody page param to openapi spec', () => {
              const renderer = new OpenapiEndpointRenderer(null, UsersController, 'paginatedPost', {
                paginate: { body: 'page' },
              })

              const response = renderer.toPathObject(routes, defaultToPathObjectOpts()).openapi
              expect(response).toEqual(
                expect.objectContaining({
                  '/users/paginated-post': expect.objectContaining({
                    post: expect.objectContaining({
                      requestBody: expect.objectContaining({
                        content: expect.objectContaining({
                          'application/json': expect.objectContaining({
                            schema: expect.objectContaining({
                              properties: expect.objectContaining({
                                page: {
                                  type: 'integer',
                                  description: 'Page number',
                                },
                              }),
                            }),
                          }),
                        }),
                      }),
                    }),
                  }),
                }),
              )
            })
          })
        })
      })

      context('scrollPagination', () => {
        context('scrollPaginate=true', () => {
          it('adds query page param to openapi spec and a request body reflecting the Dream.scrollPaginate response shape', () => {
            const renderer = new OpenapiEndpointRenderer(User, UsersController, 'scrollPaginated', {
              scrollPaginate: true,
            })

            const response = renderer.toPathObject(routes, defaultToPathObjectOpts()).openapi
            expect(response).toEqual(
              expect.objectContaining({
                '/users/scroll-paginated': expect.objectContaining({
                  parameters: expect.arrayContaining([
                    {
                      in: 'query',
                      name: 'cursor',
                      required: false,
                      allowReserved: true,
                      description: 'Scroll pagination cursor',
                      schema: {
                        type: ['string', 'null'],
                      },
                    },
                  ]),

                  get: expect.objectContaining({
                    responses: expect.objectContaining({
                      200: {
                        content: {
                          'application/json': {
                            schema: {
                              type: 'object',
                              required: ['cursor', 'results'],
                              properties: {
                                cursor: { type: ['string', 'null'] },
                                results: {
                                  type: 'array',
                                  items: { $ref: '#/components/schemas/User' },
                                },
                              },
                            },
                          },
                        },
                        description: 'Success',
                      },
                    }),
                  }),
                }),
              }),
            )
          })

          context('an STI base model', () => {
            it('the OpenAPI shape includes the children', () => {
              const renderer = new OpenapiEndpointRenderer(Balloon, BalloonsController, 'scrollPaginated', {
                scrollPaginate: true,
              })

              const response = renderer.toPathObject(routes, defaultToPathObjectOpts()).openapi
              expect(response).toEqual(
                expect.objectContaining({
                  '/balloons/scroll-paginated': expect.objectContaining({
                    parameters: expect.arrayContaining([
                      {
                        in: 'query',
                        name: 'cursor',
                        required: false,
                        allowReserved: true,
                        description: 'Scroll pagination cursor',
                        schema: {
                          type: ['string', 'null'],
                        },
                      },
                    ]),

                    get: expect.objectContaining({
                      responses: expect.objectContaining({
                        200: {
                          content: {
                            'application/json': {
                              schema: {
                                type: 'object',
                                required: ['cursor', 'results'],
                                properties: {
                                  cursor: { type: ['string', 'null'] },
                                  results: {
                                    type: 'array',
                                    items: {
                                      anyOf: [
                                        {
                                          $ref: '#/components/schemas/BalloonLatex',
                                        },
                                        {
                                          $ref: '#/components/schemas/BalloonMylar',
                                        },
                                      ],
                                    },
                                  },
                                },
                              },
                            },
                          },
                          description: 'Success',
                        },
                      }),
                    }),
                  }),
                }),
              )
            })
          })
        })

        context('scrollPaginate={ query: "<some-string>" }', () => {
          it('customizes the query cursor param', () => {
            const renderer = new OpenapiEndpointRenderer(User, UsersController, 'scrollPaginated', {
              scrollPaginate: { query: 'pagref' },
            })

            const response = renderer.toPathObject(routes, defaultToPathObjectOpts()).openapi
            expect(response).toEqual(
              expect.objectContaining({
                '/users/scroll-paginated': expect.objectContaining({
                  parameters: expect.arrayContaining([
                    {
                      in: 'query',
                      name: 'pagref',
                      required: false,
                      allowReserved: true,
                      description: 'Scroll pagination cursor',
                      schema: {
                        type: ['string', 'null'],
                      },
                    },
                  ]),
                }),
              }),
            )
          })
        })

        context('scrollPaginate={ body: "cursor" }', () => {
          it('omits the query param and adds requestBody cursor param to openapi spec', () => {
            const renderer = new OpenapiEndpointRenderer(User, UsersController, 'scrollPaginatedPost', {
              scrollPaginate: { body: 'cursor' },
            })

            const response = renderer.toPathObject(routes, defaultToPathObjectOpts()).openapi
            expect(response).toEqual(
              expect.objectContaining({
                '/users/scroll-paginated-post': expect.objectContaining({
                  parameters: expect.arrayContaining([
                    expect.not.objectContaining({
                      in: 'query',
                      name: 'cursor',
                    }),
                  ]),

                  post: expect.objectContaining({
                    requestBody: expect.objectContaining({
                      content: expect.objectContaining({
                        'application/json': expect.objectContaining({
                          schema: expect.objectContaining({
                            properties: expect.objectContaining({
                              cursor: {
                                type: ['string', 'null'],
                                description: 'Scroll pagination cursor',
                              },
                            }),
                          }),
                        }),
                      }),
                    }),
                  }),
                }),
              }),
            )
          })

          context('without a model', () => {
            it('adds requestBody cursor param to openapi spec', () => {
              const renderer = new OpenapiEndpointRenderer(null, UsersController, 'scrollPaginatedPost', {
                scrollPaginate: { body: 'cursor' },
              })

              const response = renderer.toPathObject(routes, defaultToPathObjectOpts()).openapi
              expect(response).toEqual(
                expect.objectContaining({
                  '/users/scroll-paginated-post': expect.objectContaining({
                    post: expect.objectContaining({
                      requestBody: expect.objectContaining({
                        content: expect.objectContaining({
                          'application/json': expect.objectContaining({
                            schema: expect.objectContaining({
                              properties: expect.objectContaining({
                                cursor: {
                                  type: ['string', 'null'],
                                  description: 'Scroll pagination cursor',
                                },
                              }),
                            }),
                          }),
                        }),
                      }),
                    }),
                  }),
                }),
              )
            })
          })
        })
      })

      context('for a POST request', () => {
        it('renders the query parameters', () => {
          const renderer = new OpenapiEndpointRenderer(User, UsersController, 'postHowyadoin', {
            query: {
              search: {
                required: true,
                description: 'the search term',
              },
            },
          })

          const response = renderer.toPathObject(routes, defaultToPathObjectOpts()).openapi
          expect(response).toEqual(
            expect.objectContaining({
              '/users/post-howyadoin': expect.objectContaining({
                parameters: expect.arrayContaining([
                  {
                    in: 'query',
                    name: 'search',
                    required: true,
                    allowReserved: true,
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
      })

      context('allowReserved is explicitly set to false', () => {
        it('sets allowReserved: false', () => {
          const renderer = new OpenapiEndpointRenderer(User, UsersController, 'howyadoin', {
            query: {
              search: {
                required: true,
                description: 'the search term',
                allowReserved: false,
              },
            },
          })

          const response = renderer.toPathObject(routes, defaultToPathObjectOpts()).openapi
          expect(response).toEqual(
            expect.objectContaining({
              '/users/howyadoin': expect.objectContaining({
                parameters: expect.arrayContaining([
                  expect.objectContaining({
                    allowReserved: false,
                  }),
                ]),
              }),
            }),
          )
        })
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

          const response = renderer.toPathObject(routes, defaultToPathObjectOpts()).openapi
          expect(response).toEqual(
            expect.objectContaining({
              '/users/howyadoin': expect.objectContaining({
                parameters: expect.arrayContaining([
                  {
                    in: 'query',
                    name: 'search',
                    required: true,
                    allowReserved: true,
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

          const response = renderer.toPathObject(routes, defaultToPathObjectOpts()).openapi
          expect(response).toEqual(
            expect.objectContaining({
              '/users/howyadoin': expect.objectContaining({
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

          const response = renderer.toPathObject(routes, defaultToPathObjectOpts()).openapi
          expect(response).toEqual(
            expect.objectContaining({
              '/users/howyadoin': expect.objectContaining({
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
                    allowReserved: true,
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

        const response = renderer.toPathObject(routes, defaultToPathObjectOpts()).openapi
        expect(response).toEqual(
          expect.objectContaining({
            '/users/howyadoin': expect.objectContaining({
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

          const response = renderer.toPathObject(routes, defaultToPathObjectOpts()).openapi
          expect(response).toEqual(
            expect.objectContaining({
              '/users/howyadoin': expect.objectContaining({
                parameters: expect.arrayContaining([
                  {
                    in: 'header',
                    name: 'custom-header',
                    required: false,
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

            const response = renderer.toPathObject(routes, defaultToPathObjectOpts()).openapi
            expect(response).toEqual(
              expect.objectContaining({
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
                type: ['string', 'null'],
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

        const response = renderer.toPathObject(routes, defaultToPathObjectOpts()).openapi
        expect(response['/users']!.post.requestBody).toEqual({
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
                    type: ['string', 'null'],
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

      context('for option is provided to requestBody', () => {
        it('renders params for that dream class', () => {
          const renderer = new OpenapiEndpointRenderer(Pet, UsersController, 'create', {
            requestBody: { for: User },
          })

          const response = renderer.toPathObject(routes, defaultToPathObjectOpts()).openapi
          expect(response['/users']!.post.requestBody).toEqual({
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: expect.objectContaining({
                    bio: {
                      type: 'string',
                    },
                    birthdate: {
                      format: 'date',
                      type: ['string', 'null'],
                    },
                    collarCount: {
                      type: ['string', 'null'],
                      format: 'bigint',
                    },
                  }),
                },
              },
            },
          })
        })

        context('special data types', () => {
          // the bigint format is rendered so that our openapi-typescript
          // integration can successfully convert all bigint formats to "string | number"
          // when building typescript types out of the generared openapi.json files.
          context('bigint', () => {
            context('when a bigint is rendered', () => {
              it('renders with format: "bigint"', () => {
                const renderer = new OpenapiEndpointRenderer(Pet, UsersController, 'create', {
                  requestBody: { for: User },
                })

                const response = renderer.toPathObject(routes, defaultToPathObjectOpts()).openapi
                expect(response['/users']!.post.requestBody).toEqual({
                  content: {
                    'application/json': {
                      schema: {
                        type: 'object',
                        properties: expect.objectContaining({
                          favoriteBigint: {
                            type: ['string', 'null'],
                            format: 'bigint',
                          },
                        }),
                      },
                    },
                  },
                })
              })
            })

            context('when a bigint[] is rendered', () => {
              it('renders with format: "bigint"', () => {
                const renderer = new OpenapiEndpointRenderer(Pet, UsersController, 'create', {
                  requestBody: { for: User },
                })

                const response = renderer.toPathObject(routes, defaultToPathObjectOpts()).openapi
                expect(response['/users']!.post.requestBody).toEqual({
                  content: {
                    'application/json': {
                      schema: {
                        type: 'object',
                        properties: expect.objectContaining({
                          favoriteBigints: {
                            type: ['array', 'null'],
                            items: {
                              type: 'string',
                              format: 'bigint',
                            },
                          },
                        }),
                      },
                    },
                  },
                })
              })
            })
          })
        })

        context('with only provided', () => {
          it('excludes params to the list provided', () => {
            const renderer = new OpenapiEndpointRenderer(User, UsersController, 'create', {
              requestBody: { only: ['email'] },
            })

            const response = renderer.toPathObject(routes, defaultToPathObjectOpts()).openapi
            expect(response['/users']!.post.requestBody).toEqual({
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      email: {
                        type: 'string',
                      },
                    },
                  },
                },
              },
            })
          })
        })

        context('with including provided', () => {
          it('includes params provided by the list', () => {
            const renderer = new OpenapiEndpointRenderer(User, UsersController, 'create', {
              requestBody: { only: ['email'], including: ['id'] },
            })

            const response = renderer.toPathObject(routes, defaultToPathObjectOpts()).openapi
            expect(response['/users']!.post.requestBody).toEqual({
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      email: {
                        type: 'string',
                      },
                      id: {
                        type: 'integer',
                      },
                    },
                  },
                },
              },
            })
          })

          context('with including exclusively provided', () => {
            it('includes params provided by the including list, in addition to all other paramSafe columns', () => {
              const renderer = new OpenapiEndpointRenderer(User, UsersController, 'create', {
                requestBody: { including: ['id'] },
              })

              const response = renderer.toPathObject(routes, defaultToPathObjectOpts()).openapi
              expect(response['/users']!.post.requestBody).toEqual({
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: expect.objectContaining({
                        id: {
                          type: 'integer',
                        },
                        email: {
                          type: 'string',
                        },
                      }),
                    },
                  },
                },
              })
            })
          })

          context('with including provided with blank only', () => {
            it('includes params provided by the including list exclusively', () => {
              const renderer = new OpenapiEndpointRenderer(User, UsersController, 'create', {
                requestBody: { including: ['id'], only: [] },
              })

              const response = renderer.toPathObject(routes, defaultToPathObjectOpts()).openapi
              expect(response['/users']!.post.requestBody).toEqual({
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        id: {
                          type: 'integer',
                        },
                      },
                    },
                  },
                },
              })
            })
          })
        })

        context('with combining provided', () => {
          context('with no other surrounding options provided', () => {
            it('combines whatever is provided to combining along with all existing param-safe openapi fields', () => {
              const renderer = new OpenapiEndpointRenderer(User, UsersController, 'create', {
                requestBody: {
                  combining: {
                    randomField: 'string',
                  },
                },
              })

              const response = renderer.toPathObject(routes, defaultToPathObjectOpts()).openapi
              expect(response['/users']!.post.requestBody).toEqual({
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: expect.objectContaining({
                        email: {
                          type: 'string',
                        },
                        randomField: {
                          type: 'string',
                        },
                      }),
                    },
                  },
                },
              })
            })
          })

          context('with only/including', () => {
            it('combines whatever is provided to combining along with the only/including args', () => {
              const renderer = new OpenapiEndpointRenderer(User, UsersController, 'create', {
                requestBody: {
                  only: ['email'],
                  including: ['id'],
                  combining: {
                    name: 'string',
                    email: ['string', 'null'],
                  },
                },
              })

              const response = renderer.toPathObject(routes, defaultToPathObjectOpts()).openapi
              expect(response['/users']!.post.requestBody).toEqual({
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        email: {
                          type: ['string', 'null'],
                        },
                        id: {
                          type: 'integer',
                        },
                        name: {
                          type: 'string',
                        },
                      },
                    },
                  },
                },
              })
            })
          })
        })
      })

      context('requestBody leverages only opt', () => {
        it('only renders attributes specified in only array', () => {
          const renderer = new OpenapiEndpointRenderer(Pet, ApiPetsController, 'create', {
            requestBody: { only: ['species', 'name'] },
          })

          const response = renderer.toPathObject(routes, defaultToPathObjectOpts()).openapi
          expect(response['/api/pets']!.post.requestBody).toEqual({
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    name: { type: ['string', 'null'] },
                    species: {
                      type: ['string', 'null'],
                      enum: ['cat', 'noncat', null],
                    },
                  },
                },
              },
            },
          })
        })

        context('requestBody is generated using shorthand options', () => {
          context('requestBody leverages required opt', () => {
            it('renders the required options in the required field', () => {
              const renderer = new OpenapiEndpointRenderer(Pet, ApiPetsController, 'create', {
                requestBody: { only: ['species', 'name'], required: ['species'] },
              })

              const response = renderer.toPathObject(routes, defaultToPathObjectOpts()).openapi
              expect(response['/api/pets']!.post.requestBody).toEqual({
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      required: ['species'],
                      properties: {
                        name: { type: ['string', 'null'] },
                        species: {
                          type: ['string', 'null'],
                          enum: ['cat', 'noncat', null],
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
                requestBody: { for: User, only: ['email'], required: ['id'], including: ['id'] },
              })

              const response = renderer.toPathObject(routes, defaultToPathObjectOpts()).openapi
              expect(response['/api/pets']!.post.requestBody).toEqual({
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      required: ['id'],
                      properties: {
                        email: { type: 'string' },
                        id: { type: 'integer' },
                      },
                    },
                  },
                },
              })
            })

            context('requestBody leverages for opt with virtual attributes', () => {
              it('includes virtual attributes in the request body', () => {
                const renderer = new OpenapiEndpointRenderer(Pet, ApiPetsController, 'create', {
                  requestBody: { for: User, only: ['openapiVirtualSpecTest'] },
                })

                const response = renderer.toPathObject(routes, defaultToPathObjectOpts()).openapi
                expect(response['/api/pets']!.post.requestBody).toEqual({
                  content: {
                    'application/json': {
                      schema: {
                        type: 'object',
                        properties: {
                          openapiVirtualSpecTest: { type: ['string', 'null'] },
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

      context('requestBody is not specified', () => {
        it('does not provide request body', () => {
          const renderer = new OpenapiEndpointRenderer(User, UsersController, 'show')

          const response = renderer.toPathObject(routes, defaultToPathObjectOpts()).openapi
          expect(response['/users/{id}']!.get.requestBody).toBeUndefined()
        })

        context('for a POST http method', () => {
          it('provides request body matching the model', () => {
            const renderer = new OpenapiEndpointRenderer(User, UsersController, 'create')

            const response = renderer.toPathObject(routes, defaultToPathObjectOpts()).openapi
            expect(response['/users']!.post.requestBody).toEqual(
              expect.objectContaining({
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: expect.objectContaining({
                        bio: { type: 'string' },
                        birthdate: { type: ['string', 'null'], format: 'date' },
                        createdOn: { type: 'string', format: 'date' },
                        email: { type: 'string' },
                        favoriteBooleans: { type: ['array', 'null'], items: { type: 'boolean' } },
                        favoriteCitext: { type: ['string', 'null'] },
                        favoriteCitexts: {
                          type: ['array', 'null'],
                          items: { type: 'string' },
                        },
                        favoriteDates: {
                          type: ['array', 'null'],
                          items: { type: 'string', format: 'date' },
                        },
                        favoriteDatetimes: {
                          type: ['array', 'null'],
                          items: { type: 'string', format: 'date-time' },
                        },
                        favoriteIntegers: {
                          type: ['array', 'null'],
                          items: { type: 'integer' },
                        },
                        favoriteNumerics: {
                          type: ['array', 'null'],
                          items: { type: 'number', format: 'decimal' },
                        },
                        favoriteTexts: {
                          type: ['array', 'null'],
                          items: { type: 'string' },
                        },
                        name: { type: ['string', 'null'] },
                        nicknames: {
                          type: ['array', 'null'],
                          items: { type: 'string' },
                        },
                        notes: { type: ['string', 'null'] },
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
                        requiredFavoriteNumerics: {
                          type: 'array',
                          items: { type: 'number', format: 'decimal' },
                        },
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

                const response = renderer.toPathObject(routes, defaultToPathObjectOpts()).openapi
                expect(response['/users']!.post.requestBody).toEqual(
                  expect.objectContaining({
                    content: {
                      'application/json': {
                        schema: {
                          type: 'object',
                          properties: expect.objectContaining({
                            requiredFavoriteBigint: { type: 'string', format: 'bigint' },
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

                  const response = renderer.toPathObject(routes, defaultToPathObjectOpts()).openapi
                  expect(response['/users']!.post.requestBody).toEqual(
                    expect.objectContaining({
                      content: {
                        'application/json': {
                          schema: {
                            type: 'object',
                            properties: expect.objectContaining({
                              requiredFavoriteBigints: {
                                type: 'array',
                                items: { type: 'string', format: 'bigint' },
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

            context('uuid', () => {
              it('returns string', () => {
                const renderer = new OpenapiEndpointRenderer(User, UsersController, 'create')

                const response = renderer.toPathObject(routes, defaultToPathObjectOpts()).openapi
                expect(response['/users']!.post.requestBody).toEqual(
                  expect.objectContaining({
                    content: {
                      'application/json': {
                        schema: {
                          type: 'object',
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

                  const response = renderer.toPathObject(routes, defaultToPathObjectOpts()).openapi
                  expect(response['/users']!.post.requestBody).toEqual(
                    expect.objectContaining({
                      content: {
                        'application/json': {
                          schema: {
                            type: 'object',
                            properties: expect.objectContaining({
                              favoriteUuids: {
                                type: ['array', 'null'],
                                items: { type: 'string' },
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

            context('json', () => {
              it('returns object schema', () => {
                const renderer = new OpenapiEndpointRenderer(User, UsersController, 'create')

                const response = renderer.toPathObject(routes, defaultToPathObjectOpts()).openapi
                expect(response['/users']!.post.requestBody).toEqual(
                  expect.objectContaining({
                    content: {
                      'application/json': {
                        schema: {
                          type: 'object',
                          properties: expect.objectContaining({
                            jsonData: { type: ['object', 'null'] },
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

                  const response = renderer.toPathObject(routes, defaultToPathObjectOpts()).openapi
                  expect(response['/users']!.post.requestBody).toEqual(
                    expect.objectContaining({
                      content: {
                        'application/json': {
                          schema: {
                            type: 'object',
                            properties: expect.objectContaining({
                              favoriteJsons: {
                                type: ['array', 'null'],
                                items: { type: 'object' },
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

            context('jsonb', () => {
              it('returns object schema', () => {
                const renderer = new OpenapiEndpointRenderer(User, UsersController, 'create')

                const response = renderer.toPathObject(routes, defaultToPathObjectOpts()).openapi
                expect(response['/users']!.post.requestBody).toEqual(
                  expect.objectContaining({
                    content: {
                      'application/json': {
                        schema: {
                          type: 'object',
                          properties: expect.objectContaining({
                            jsonbData: { type: ['object', 'null'] },
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

                  const response = renderer.toPathObject(routes, defaultToPathObjectOpts()).openapi
                  expect(response['/users']!.post.requestBody).toEqual(
                    expect.objectContaining({
                      content: {
                        'application/json': {
                          schema: {
                            type: 'object',
                            properties: expect.objectContaining({
                              favoriteJsonbs: {
                                type: ['array', 'null'],
                                items: { type: 'object' },
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

            context('virtual columns', () => {
              it('returns an anyOf statement, allowing all types', () => {
                const renderer = new OpenapiEndpointRenderer(User, UsersController, 'create')

                const response = renderer.toPathObject(routes, defaultToPathObjectOpts()).openapi
                expect(response['/users']!.post.requestBody).toEqual(
                  expect.objectContaining({
                    content: {
                      'application/json': {
                        schema: {
                          type: 'object',
                          properties: expect.objectContaining({
                            password: { type: ['string', 'null'] },
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

                  const response = renderer.toPathObject(routes, defaultToPathObjectOpts()).openapi
                  expect(response['/users']!.post.requestBody).toEqual(
                    expect.objectContaining({
                      content: {
                        'application/json': {
                          schema: {
                            type: 'object',
                            properties: expect.objectContaining({
                              openapiVirtualSpecTest: {
                                type: ['string', 'null'],
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

                const response = renderer.toPathObject(routes, defaultToPathObjectOpts()).openapi
                expect(response['/pets']!.post.requestBody).toEqual(
                  expect.objectContaining({
                    content: {
                      'application/json': {
                        schema: {
                          type: 'object',
                          properties: expect.objectContaining({
                            species: { type: ['string', 'null'], enum: ['cat', 'noncat', null] },
                            nonNullSpecies: { type: 'string', enum: ['cat', 'noncat'] },
                          }),
                        },
                      },
                    },
                  }),
                )
              })

              it('renders enum[] as array with string with enum option', () => {
                const renderer = new OpenapiEndpointRenderer(Pet, PetsController, 'create')

                const response = renderer.toPathObject(routes, defaultToPathObjectOpts()).openapi
                expect(response['/pets']!.post.requestBody).toEqual(
                  expect.objectContaining({
                    content: {
                      'application/json': {
                        schema: {
                          type: 'object',
                          properties: expect.objectContaining({
                            favoriteTreats: {
                              type: ['array', 'null'],
                              items: {
                                type: 'string',
                                enum: ['efishy feesh', 'snick snowcks'],
                              },
                            },

                            nonNullFavoriteTreats: {
                              type: 'array',
                              items: {
                                type: 'string',
                                enum: ['efishy feesh', 'snick snowcks'],
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

            context('suppressResponseEnums=true', () => {
              it('does not suppress enums for request bodies', () => {
                const renderer = new OpenapiEndpointRenderer(Pet, PetsController, 'create')

                const response = renderer.toPathObject(
                  routes,
                  defaultToPathObjectOpts({ renderOpts: { casing: 'camel', suppressResponseEnums: true } }),
                ).openapi

                expect(response['/pets']!.post.requestBody).toEqual(
                  expect.objectContaining({
                    content: {
                      'application/json': {
                        schema: {
                          type: 'object',
                          properties: expect.objectContaining({
                            favoriteTreats: {
                              type: ['array', 'null'],
                              items: {
                                type: 'string',
                                enum: ['efishy feesh', 'snick snowcks'],
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

            context('requestBody is explicitly set to null', () => {
              it('does not provide requestBody', () => {
                const renderer = new OpenapiEndpointRenderer(Pet, ApiPetsController, 'create', {
                  requestBody: null,
                })

                const response = renderer.toPathObject(routes, defaultToPathObjectOpts()).openapi
                expect(response['/api/pets']!.post.requestBody).toBeUndefined()
              })
            })
          })

          context('columns explicitly excluded from paramSafeColumns', () => {
            it('are omitted', () => {
              const renderer = new OpenapiEndpointRenderer(Post, PetsController, 'myPosts')

              const response = renderer.toPathObject(routes, defaultToPathObjectOpts()).openapi
              expect(response['/pets/{id}/my-posts']!.post.requestBody).toEqual(
                expect.objectContaining({
                  content: {
                    'application/json': {
                      schema: {
                        type: 'object',
                        properties: {
                          body: { type: ['string', 'null'] },
                        },
                      },
                    },
                  },
                }),
              )
            })
          })
        })

        context('for a PUT http method', () => {
          it('prvoides request body matching the model', () => {
            const renderer = new OpenapiEndpointRenderer(Pet, PetsController, 'update')

            const response = renderer.toPathObject(routes, defaultToPathObjectOpts()).openapi
            expect(response['/pets/{id}']!.patch.requestBody).toEqual(
              expect.objectContaining({
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: expect.objectContaining({
                        collarCount: {
                          type: ['string', 'null'],
                          format: 'bigint',
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

          const response = renderer.toPathObject(routes, defaultToPathObjectOpts()).openapi
          expect(response['/users/howyadoin']!.get.responses).toEqual(
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

          const response = renderer.toPathObject(routes, defaultToPathObjectOpts()).openapi
          expect(response['/users/howyadoin']!.get.responses).toEqual(
            expect.objectContaining({
              490: {
                $ref: '#/components/responses/CustomResponse',
              },
            }),
          )
        })

        it('config-level default responses are overridden by endpoint-level responses', () => {
          const renderer = new OpenapiEndpointRenderer(User, UsersController, 'howyadoin', {
            responses: {
              418: {
                description: 'boo!lean',
                type: 'boolean',
              },
            },
          })

          const response = renderer.toPathObject(routes, defaultToPathObjectOpts()).openapi
          expect(response['/users/howyadoin']!.get.responses).toEqual(
            expect.objectContaining({
              '418': {
                description: 'Status 418',
                content: {
                  'application/json': {
                    schema: {
                      description: 'boo!lean',
                      type: 'boolean',
                    },
                  },
                },
              },
            }),
          )
        })

        context('default responses are explicitly bypassed', () => {
          it('config-level default responses are omitted', () => {
            const renderer = new OpenapiEndpointRenderer(User, UsersController, 'howyadoin', {
              omitDefaultResponses: true,
            })

            const response = renderer.toPathObject(routes, defaultToPathObjectOpts()).openapi
            expect(response['/users/howyadoin']!.get.responses).toEqual(
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

          const response = renderer.toPathObject(routes, defaultToPathObjectOpts()).openapi
          expect(response['/users/howyadoin']!.get.responses['200']).toBeUndefined()
          expect(response['/users/howyadoin']!.get.responses['204']).toEqual({
            description: 'Success, no content',
            $ref: '#/components/responses/NoContent',
          })
        })
      })

      context('when the response shape does not specify response body content', () => {
        it('does not render it in a "content" block (allows 204s with custom descriptions/summaries)', () => {
          const renderer = new OpenapiEndpointRenderer(User, UsersController, 'howyadoin', {
            responses: {
              204: {
                description: 'This has a custom description',
              },
            },
          })

          const response = renderer.toPathObject(routes, defaultToPathObjectOpts()).openapi
          expect(response['/users/howyadoin']!.get.responses['200']).toBeUndefined()
          expect(response['/users/howyadoin']!.get.responses['204']).toEqual({
            description: 'This has a custom description',
          })
        })
      })

      context('specifying a content-type', () => {
        it('renders that content type instead of application/json', () => {
          const renderer = new OpenapiEndpointRenderer(User, UsersController, 'howyadoin', {
            status: 200,
            responses: {
              200: {
                contentType: 'image/png',
                type: 'string',
                format: 'binary',
              },
            },
          })

          const response = renderer.toPathObject(routes, defaultToPathObjectOpts()).openapi
          expect(response['/users/howyadoin']!.get.responses['200']).toEqual(
            expect.objectContaining({
              content: {
                'image/png': {
                  schema: {
                    type: 'string',
                    format: 'binary',
                  },
                },
              },
            }),
          )
        })
      })

      context('specifying multiple content-types', () => {
        it('renders that content type instead of application/json', () => {
          const renderer = new OpenapiEndpointRenderer(User, UsersController, 'howyadoin', {
            status: 200,
            responses: {
              200: {
                contentType: ['image/jpeg', 'image/png'],
                type: 'string',
                format: 'binary',
              },
            },
          })

          const response = renderer.toPathObject(routes, defaultToPathObjectOpts()).openapi
          expect(response['/users/howyadoin']!.get.responses['200']).toEqual(
            expect.objectContaining({
              content: {
                'image/jpeg': {
                  schema: {
                    type: 'string',
                    format: 'binary',
                  },
                },
                'image/png': {
                  schema: {
                    type: 'string',
                    format: 'binary',
                  },
                },
              },
            }),
          )
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

          const response = renderer.toPathObject(routes, defaultToPathObjectOpts()).openapi
          expect(response['/users/howyadoin']!.get.responses['200']).toBeUndefined()
          expect(response['/users/howyadoin']!.get.responses['204']).toEqual({
            description: 'World',
            $ref: '#/components/responses/NoContent',
          })
          expect(response['/users/howyadoin']!.get.responses['205']).toEqual(
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

          const response = renderer.toPathObject(routes, defaultToPathObjectOpts()).openapi
          expect(response['/users/howyadoin']!.get.responses).toEqual(
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
              defaultResponse: { maybeNull: true },
            })

            const response = renderer.toPathObject(routes, defaultToPathObjectOpts()).openapi
            expect(response['/users/howyadoin']!.get.responses).toEqual(
              expect.objectContaining({
                200: {
                  description: 'Success',
                  content: {
                    'application/json': {
                      schema: {
                        anyOf: [{ $ref: '#/components/schemas/UserWithRecentPost' }, { type: 'null' }],
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

          const response = renderer.toPathObject(routes, defaultToPathObjectOpts()).openapi
          expect(response['/users/howyadoin']!.get.responses).toEqual(
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

          const response = renderer.toPathObject(routes, defaultToPathObjectOpts()).openapi
          expect(response['/users/howyadoin']!.get.responses).toEqual(
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

          const response = renderer.toPathObject(routes, defaultToPathObjectOpts()).openapi
          expect(response['/users/howyadoin']!.get.responses).toEqual(
            expect.objectContaining({
              200: {
                description: 'Success',
                content: {
                  'application/json': {
                    schema: {
                      anyOf: [
                        {
                          $ref: '#/components/schemas/Post',
                        },
                        {
                          $ref: '#/components/schemas/User',
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
            [UserSerializer, PostSerializer],
            UsersController,
            'howyadoin',
            {},
          )

          const response = renderer.toPathObject(routes, defaultToPathObjectOpts()).openapi
          expect(response['/users/howyadoin']!.get.responses).toEqual(
            expect.objectContaining({
              200: {
                description: 'Success',
                content: {
                  'application/json': {
                    schema: {
                      anyOf: [
                        {
                          $ref: '#/components/schemas/Post',
                        },
                        {
                          $ref: '#/components/schemas/User',
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

          const response = renderer.toPathObject(routes, defaultToPathObjectOpts()).openapi
          expect(response['/users/howyadoin']!.get.responses).toEqual(
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
                      anyOf: [
                        {
                          $serializer: CommentTestingDecimalShorthandSerializer,
                        },
                        { type: 'null' },
                      ],
                    },
                  ],
                },
              },
            })

            const response = renderer.toPathObject(routes, defaultToPathObjectOpts()).openapi
            expect(response['/users/howyadoin']!.get.responses).toEqual(
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
                            anyOf: [
                              {
                                $ref: '#/components/schemas/CommentTestingDecimalShorthand',
                              },
                              { type: 'null' },
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

          const response = renderer.toPathObject(routes, defaultToPathObjectOpts()).openapi
          expect(response['/users/howyadoin']!.get.responses).toEqual(
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

          const response = renderer.toPathObject(routes, defaultToPathObjectOpts()).openapi
          expect(response['/users/howyadoin']!.get.responses).toEqual(
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

          const response = renderer.toPathObject(routes, defaultToPathObjectOpts()).openapi
          expect(response['/users/howyadoin']!.get.responses).toEqual(
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

          const response = renderer.toPathObject(routes, defaultToPathObjectOpts()).openapi
          expect(response['/users/howyadoin']!.get.responses).toEqual(
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

          const response = renderer.toPathObject(routes, defaultToPathObjectOpts()).openapi
          expect(response['/users/howyadoin']!.get).toEqual(
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
                type: ['object', 'null'],
                description: 'my description',
                summary: 'my summary',
                properties: {
                  name: 'string',
                  names: 'string[]',
                  maybeNullNames: ['string[]', 'null'],
                  maybeNullNames2: {
                    type: ['string[]', 'null'],
                  },
                  maybeNullArray: {
                    type: ['array', 'null'],
                    items: {
                      type: 'number',
                    },
                  },
                },
              },
            },
          })

          const response = renderer.toPathObject(routes, defaultToPathObjectOpts()).openapi
          expect(response['/users/howyadoin']!.get.responses).toEqual(
            expect.objectContaining({
              201: {
                description: 'Created',
                content: {
                  'application/json': {
                    schema: {
                      type: ['object', 'null'],
                      description: 'my description',
                      summary: 'my summary',
                      properties: {
                        name: {
                          type: 'string',
                        },
                        names: {
                          type: 'array',
                          items: {
                            type: 'string',
                          },
                        },
                        maybeNullNames: {
                          type: ['array', 'null'],
                          items: {
                            type: 'string',
                          },
                        },
                        maybeNullNames2: {
                          type: ['array', 'null'],
                          items: {
                            type: 'string',
                          },
                        },
                        maybeNullArray: {
                          type: ['array', 'null'],
                          items: {
                            type: 'number',
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

          const response = renderer.toPathObject(routes, defaultToPathObjectOpts()).openapi
          expect(response['/users/howyadoin']!.get.responses).toEqual(
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

        context('maybe null', () => {
          it('includes null in the allowed enum values', () => {
            const renderer = new OpenapiEndpointRenderer(User, UsersController, 'howyadoin', {
              serializerKey: 'extra',
              status: 201,
              responses: {
                201: {
                  type: ['string', 'null'],
                  enum: ['hello', 'world', null],
                },
              },
            })

            const response = renderer.toPathObject(routes, defaultToPathObjectOpts()).openapi
            expect(response['/users/howyadoin']!.get.responses).toEqual(
              expect.objectContaining({
                201: {
                  description: 'Created',
                  content: {
                    'application/json': {
                      schema: {
                        type: ['string', 'null'],
                        enum: ['hello', 'world', null],
                      },
                    },
                  },
                },
              }),
            )
          })
        })

        context('suppressResponseEnums=true', () => {
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

            const response = renderer.toPathObject(
              routes,
              defaultToPathObjectOpts({ renderOpts: { casing: 'camel', suppressResponseEnums: true } }),
            ).openapi

            expect(response['/users/howyadoin']!.get.responses).toEqual(
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

          const response = renderer.toPathObject(routes, defaultToPathObjectOpts()).openapi
          expect(response['/users/howyadoin']!.get.responses).toEqual(
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

      context('with paginate=true', () => {
        const expectedPagination = {
          200: {
            description: 'Success',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['recordCount', 'pageCount', 'currentPage', 'results'],
                  properties: {
                    recordCount: {
                      type: 'number',
                    },
                    pageCount: {
                      type: 'number',
                    },
                    currentPage: {
                      type: 'number',
                    },
                    results: {
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
        }

        it('captures results into an array and includes pagination fields in response shape', () => {
          const renderer = new OpenapiEndpointRenderer(User, UsersController, 'howyadoin', {
            serializerKey: 'extra',
            paginate: true,
          })

          const response = renderer.toPathObject(routes, defaultToPathObjectOpts()).openapi
          expect(response['/users/howyadoin']!.get.responses).toEqual(
            expect.objectContaining(expectedPagination),
          )
        })

        context('when many is also passed', () => {
          it('paginate correctly overrides many option', () => {
            const renderer = new OpenapiEndpointRenderer(User, UsersController, 'howyadoin', {
              serializerKey: 'extra',
              many: true,
              paginate: true,
            })

            const response = renderer.toPathObject(routes, defaultToPathObjectOpts()).openapi
            expect(response['/users/howyadoin']!.get.responses).toEqual(
              expect.objectContaining(expectedPagination),
            )
          })
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
                        type: ['string', 'null'],
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

          const response = renderer.toPathObject(routes, defaultToPathObjectOpts()).openapi
          expect(response['/users/howyadoin']!.get.responses).toEqual(
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
                              type: ['string', 'null'],
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

    context('when a controller contains overrides', () => {
      it('those overrides supercede defaults', () => {
        const renderer = new OpenapiEndpointRenderer(
          CommentTestingStringSerializer,
          OpenapiOverridesTestController,
          'testOpenapiConfigOverrides',
          {
            status: 200,
          },
        )

        expect(renderer.toPathObject(routes, defaultToPathObjectOpts()).openapi).toEqual({
          '/openapi/openapi-overrides': expect.objectContaining({
            parameters: [],
            get: expect.objectContaining({
              responses: {
                '200': {
                  content: {
                    'application/json': {
                      schema: { $ref: '#/components/schemas/CommentTestingString' },
                    },
                  },
                  description: 'Success',
                },
              },
              tags: ['hello', 'world'],
            }) as object,
          }) as object,
        })
      })
    })
  })
})
