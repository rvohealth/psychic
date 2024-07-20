import OpenapiRenderer from '../../../src/helpers/openapi-renderer'
import User from '../../../test-app/app/models/User'

describe('OpenapiRenderer', () => {
  describe('#toJson', () => {
    context('headers', () => {
      it('renders headers within the parameters array', () => {
        const renderer = new OpenapiRenderer(() => User, {
          path: '/how/yadoin',
          method: 'get',
          status: 200,
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

    context('params', () => {
      it('renders params within the parameters array', () => {
        const renderer = new OpenapiRenderer(() => User, {
          path: '/how/yadoin',
          method: 'get',
          status: 200,
          params: [
            {
              in: 'path',
              name: 'search',
              required: true,
              description: 'the search term',
              type: 'string',
            },
            {
              in: 'body',
              name: 'user',
              required: false,
              type: {
                email: 'string',
                password: 'string',
                settings: {
                  likesChalupas: 'boolean',
                },
              },
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
                {
                  in: 'body',
                  name: 'user',
                  required: false,
                  description: '',
                  schema: {
                    type: 'object',
                    properties: {
                      email: {
                        type: 'string',
                      },
                      password: {
                        type: 'string',
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
              ],
            }),
          }),
        )
      })
    })

    context('response', () => {
      context('with a dream model passed', () => {
        it("identifies the default serializer and converts it's payload shape to openapi format", () => {
          const renderer = new OpenapiRenderer(() => User, {
            path: '/how/yadoin',
            method: 'get',
            status: 200,
            serializerKey: 'extra',
          })
          const response = renderer.toObject()
          expect(response).toEqual(
            expect.objectContaining({
              '/how/yadoin': {
                parameters: [],
                get: {
                  tags: [],
                  summary: '',
                  requestBody: {
                    content: {
                      'application/json': {
                        schema: {
                          type: 'object',
                          properties: {
                            id: { type: 'string' },
                            nicknames: { type: 'string[]' },
                            howyadoin: {
                              type: 'object',
                              properties: {
                                label: {
                                  type: 'string',
                                },
                                value: {
                                  type: 'object',
                                  properties: {
                                    label: {
                                      type: 'string',
                                    },
                                    value: {
                                      type: 'number',
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
              },
            }),
          )
        })
      })
    })
  })
})
