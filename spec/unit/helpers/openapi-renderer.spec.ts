import OpenapiRenderer from '../../../src/helpers/openapi-renderer'
import User from '../../../test-app/app/models/User'
import { UserExtraSerializer } from '../../../test-app/app/serializers/UserSerializer'

describe('OpenapiRenderer', () => {
  describe('#toObject', () => {
    context('headers', () => {
      it('renders headers within the parameters array', () => {
        const renderer = new OpenapiRenderer(() => User, {
          path: '/how/yadoin',
          method: 'get',
          headers: [
            {
              name: 'Authorization',
              required: true,
              description: 'The authorization token',
            },
            {
              name: 'locale',
              required: false,
            },
          ],
        })
        const response = renderer.toObject()
        expect(response).toEqual(
          expect.objectContaining({
            '/how/yadoin': expect.objectContaining({
              parameters: [
                {
                  in: 'header',
                  name: 'Authorization',
                  required: true,
                  description: 'The authorization token',
                  schema: {
                    type: 'string',
                  },
                },
                {
                  in: 'header',
                  name: 'locale',
                  required: false,
                  description: '',
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

    context('uri', () => {
      it('renders params within the parameters array', () => {
        const renderer = new OpenapiRenderer(() => User, {
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

        const response = renderer.toObject()
        expect(response).toEqual(
          expect.objectContaining({
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

    context('body', () => {
      it('renders params within the parameters array', () => {
        const renderer = new OpenapiRenderer(() => User, {
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

        const response = renderer.toObject()
        expect(response['/how/yadoin'].get.requestBody).toEqual({
          content: {
            'application/json': {
              schema: {
                type: 'object',
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
        it("identifies the default serializer and converts it's payload shape to openapi format", () => {
          const renderer = new OpenapiRenderer(() => User, {
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
                    },
                  },
                },
              },
            },
          })

          const response = renderer.toObject()
          expect(response['/how/yadoin'].get.responses).toEqual(
            expect.objectContaining({
              201: {
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

      context('with a serializer passed', () => {
        it("uses the provided serializer, converting it's payload shape to openapi format", () => {
          const renderer = new OpenapiRenderer(() => UserExtraSerializer, {
            path: '/how/yadoin',
            method: 'get',
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
                    },
                  },
                },
              },
            },
          })

          const response = renderer.toObject()
          expect(response['/how/yadoin'].get.responses).toEqual(
            expect.objectContaining({
              201: {
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
