import packageJson from '../../../../package.json'
import OpenapiAppRenderer from '../../../../src/openapi-renderer/app'

describe('OpenapiAppRenderer', () => {
  describe('.toObject', () => {
    context('default', () => {
      it('reads all default controllers and consolidates endpoints, also providing boilerplate openapi headers', async () => {
        const response = await OpenapiAppRenderer.toObject()

        expect(response.default).toEqual(
          expect.objectContaining({
            openapi: '3.0.2',
            info: {
              version: packageJson.version,
              title: packageJson.name,
              description: packageJson.description,
            },
            security: [{ bearerToken: [] }],
          }),
        )

        expect(response.default.components.securitySchemes).toEqual({
          bearerToken: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'custom auth token',
          },
        })

        expect(response.default.paths['/greeter/justforspecs']).toEqual(
          expect.objectContaining({
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            parameters: expect.arrayContaining([
              {
                description: 'custom header',
                in: 'header',
                name: 'custom-header',
                required: true,
                schema: {
                  type: 'string',
                },
              },
            ]),

            get: {
              tags: [],
              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
              responses: expect.objectContaining({
                '200': {
                  description: 'Success',
                  content: {
                    'application/json': {
                      schema: {
                        $ref: '#/components/schemas/CommentTestingBasicSerializerRef',
                      },
                    },
                  },
                },
              }),
            },
          }),
        )

        expect(response.default.paths['/users/{id}/justforspecs']).toEqual(
          expect.objectContaining({
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            parameters: expect.arrayContaining([
              {
                description: 'custom header',
                in: 'header',
                name: 'custom-header',
                required: true,
                schema: {
                  type: 'string',
                },
              },
            ]),

            get: {
              tags: [],
              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
              responses: expect.objectContaining({
                '200': {
                  description: 'Success',
                  content: {
                    'application/json': {
                      schema: {
                        $ref: '#/components/schemas/CommentTestingBasicSerializerRef',
                      },
                    },
                  },
                },
              }),
            },
          }),
        )

        expect(response.default.paths['/users']).toEqual(
          expect.objectContaining({
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            parameters: expect.arrayContaining([
              expect.objectContaining({
                description: 'custom header',
                in: 'header',
                name: 'custom-header',
                required: true,
                schema: {
                  type: 'string',
                },
              }),
            ]),
          }),
        )

        expect(response.default.paths['/users']).toEqual(
          expect.objectContaining({
            post: {
              tags: [],
              requestBody: {
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
                        favoriteBigint: { type: 'string', nullable: true },
                        favoriteBigints: {
                          type: 'array',
                          items: { type: 'string' },
                          nullable: true,
                        },
                      }),
                    },
                  },
                },
              },

              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
              responses: expect.objectContaining({
                201: {
                  content: {
                    'application/json': {
                      schema: {
                        $ref: '#/components/schemas/UserExtra',
                      },
                    },
                  },
                  description: 'Created',
                },
              }),
            },
          }),
        )

        expect(response.default.paths['/users']).toEqual(
          expect.objectContaining({
            get: {
              tags: [],
              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
              responses: expect.objectContaining({
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
                  description: 'Success',
                },
              }),
            },
          }),
        )

        expect(response.default.paths).toEqual(
          expect.objectContaining({
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            '/users/{id}': expect.objectContaining({
              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
              parameters: expect.arrayContaining([
                {
                  in: 'path',
                  name: 'id',
                  description: 'The ID of the User',
                  required: true,
                  schema: {
                    type: 'string',
                  },
                },
              ]),
              get: {
                tags: [],
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                responses: expect.objectContaining({
                  '200': {
                    description: 'Success',
                    content: {
                      'application/json': { schema: { $ref: '#/components/schemas/UserWithPosts' } },
                    },
                  },
                }),
              },

              delete: {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                responses: expect.objectContaining({
                  '204': {
                    description: 'Success, no content',
                  },
                }),
                tags: [],
              },
            }),
          }),
        )

        expect(response.default.components).toEqual(
          expect.objectContaining({
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            schemas: expect.objectContaining({
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

              UserWithPosts: {
                type: 'object',
                required: ['id', 'posts'],
                properties: {
                  id: { type: 'integer' },
                  posts: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/PostWithComments' },
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

              CommentTestingBasicSerializerRef: {
                type: 'object',
                required: ['howyadoin'],
                properties: {
                  howyadoin: {
                    $ref: '#/components/schemas/CommentTestingDoubleShorthand',
                  },
                },
              },

              CommentTestingDoubleShorthand: {
                type: 'object',
                required: ['howyadoin'],
                properties: { howyadoin: { type: 'number', format: 'double' } },
              },

              ValidationErrors: {
                type: 'object',
                properties: {
                  errors: {
                    type: 'object',
                    additionalProperties: {
                      type: 'array',
                      items: {
                        type: 'string',
                      },
                    },
                  },
                },
              },

              CustomSchema: {
                type: 'string',
              },
            }),

            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            responses: expect.objectContaining({
              CustomResponse: {
                description: 'my custom response',
                content: {
                  'application/json': {
                    schema: {
                      type: 'string',
                    },
                  },
                },
              },

              // 400
              BadRequest: {
                description:
                  'The server would not process the request due to something the server considered to be a client error',
              },

              // 401
              Unauthorized: {
                description:
                  'The request was not successful because it lacks valid authentication credentials for the requested resource',
              },

              // 403
              Forbidden: {
                description: 'Understood the request, but refused to process it',
              },

              // 404
              NotFound: {
                description: 'The specified resource was not found',
              },

              // 409
              Conflict: {
                description:
                  'The request failed because a conflict was detected with the given request params',
              },

              // 422
              ValidationErrors: {
                description:
                  'The request failed to process due to validation errors with the provided values',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/ValidationErrors',
                    },
                  },
                },
              },

              // 500
              InternalServerError: {
                description:
                  'the server encountered an unexpected condition that prevented it from fulfilling the request',
              },
            }),
          }),
        )
      })
    })

    context('admin', () => {
      it('reads all admin controllers and consolidates endpoints, also providing boilerplate admin openapi headers', async () => {
        const response = await OpenapiAppRenderer.toObject()

        expect(response.admin).toEqual(
          expect.objectContaining({
            openapi: '3.0.2',
            info: {
              version: packageJson.version,
              title: packageJson.name,
              description: packageJson.description,
            },
            security: [{ bearerToken: [] }],
          }),
        )

        expect(response.admin.components.securitySchemes).toEqual({
          bearerToken: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'custom admin auth token',
          },
        })

        expect(response.admin.paths['/admin/test']).toEqual({
          parameters: [
            {
              in: 'header',
              name: 'custom-admin-header',
              required: true,
              description: 'custom admin header',
              schema: { type: 'string' },
            },
          ],
          get: {
            tags: [],
            responses: {
              '200': { description: 'Success' },
              '400': { $ref: '#/components/responses/BadRequest' },
              '401': { $ref: '#/components/responses/Unauthorized' },
              '403': { $ref: '#/components/responses/Forbidden' },
              '404': { $ref: '#/components/responses/NotFound' },
              '409': { $ref: '#/components/responses/Conflict' },
              '422': { $ref: '#/components/responses/ValidationErrors' },
              '490': { $ref: '#/components/responses/CustomAdminResponse' },
              '500': { $ref: '#/components/responses/InternalServerError' },
            },
          },
        })
        expect(response.admin.paths['/greeter/justforspecs']).toBeUndefined()
      })
    })
  })
})
