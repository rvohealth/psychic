import { PsychicController } from '../../../../src'

describe('Openapi decorator', () => {
  context('params', () => {
    class MyController extends PsychicController {
      public show() {}
    }

    it('', async () => {
      expect(123).toEqual({
        openapi: '3.0.2',
        info: {
          title: 'Wellos Central',
          version: '1.0',
        },
        servers: [
          {
            url: 'https://central-dev.wellos.com',
          },
        ],
        paths: {
          '/central/v1/stripe-checkout-sessions': {
            parameters: [
              {
                in: 'header',
                name: 'Authorization',
                description: 'The authorization token in the form of `Bearer: <token from MSAL>`',
                schema: {
                  type: 'string',
                },
                required: true,
              },
              {
                in: 'header',
                name: 'Content-Language',
                description:
                  'The language and region code, e.g., en-US. Unsupported or unrecognized codes will fall back to en-US',
                schema: {
                  type: 'string',
                },
                required: true,
              },
              {
                in: 'header',
                name: 'today',
                description: "The current date in the User's timezone",
                schema: {
                  type: 'string',
                  format: 'date',
                },
                required: true,
              },
              {
                in: 'header',
                name: 'timezone',
                description: "The name of the user's current timezone, e.g., 'America/New_York'",
                schema: {
                  type: 'string',
                },
                required: true,
              },
            ],
            post: {
              tags: ['stripe'],
              summary: 'Creates a Stripe Checkout session for the user',
              requestBody: {
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        priceId: {
                          description: 'The Price ID (from Stripe) of the Price the user has selected',
                          type: 'string',
                        },
                        promoCode: {
                          description: 'The promo code (from Stripe) that will be applied for the user',
                          type: 'string',
                        },
                      },
                    },
                  },
                },
              },
              responses: {
                '201': {
                  description: 'Stripe Checkout session was created for the user',
                  content: {
                    'application/json': {
                      schema: {
                        type: 'object',
                        required: ['url'],
                        properties: {
                          url: {
                            description:
                              'The URL to which to redirect the user (includes the signed session)',
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
      })
    })
  })
})
