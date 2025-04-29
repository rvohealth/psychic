import { DateTime } from '@rvoh/dream'
import { specRequest as request } from '@rvoh/psychic-spec-helpers'
import { PsychicApp, PsychicServer } from '../../../../src/index.js'

describe('hitting an endpoint with openapi validation activated', () => {
  const subject = async (data: object, expectedStatus: number) =>
    await request.post('/openapi-validation-test', expectedStatus, {
      headers: {
        'custom-header': 'hi',
      },
      data,
    })

  beforeEach(async () => {
    const psychicApp = PsychicApp.getOrFail()

    psychicApp.set('openapi', {
      validation: {
        validateRequests: true,
        // validateResponses: EnvInternal.isTest,
        // ignoreUndocumented: true,
        formats: {
          'date-time': {
            type: 'string',
            validate: (value: DateTime | string) => {
              return value instanceof DateTime
                ? value.isValid
                : typeof value === 'string'
                  ? DateTime.fromISO(value).isValid
                  : false
            },
          },
          decimal: {
            type: 'string',
            validate: (value: string) => /^-?(\d+\.?\d*|\d*\.?\d+)$/.test(value),
          },
        },
        // serialize/deserialize
        serDes: [
          {
            format: 'date-time',
            deserialize: s => DateTime.fromISO(s),
            serialize: (o: unknown) => (o instanceof DateTime ? o.toISO() : (o as string))!,
          },
        ],
        // ignorePaths: ignorePaths.length ? new RegExp(ignorePaths.join('|')) : undefined,
      },
    })

    await request.init(PsychicServer)
  })

  it('returns 204 with the param present', async () => {
    await subject({ howyadoin: 'howyadoin' }, 204)
  })

  context('with the test field not present in params', () => {
    it('throws a 400', async () => {
      await subject({ howyadoin: 1 }, 400)
    })
  })

  context('openapi arrays', () => {
    context('explicit array field with array brackets in query', () => {
      it('succeeds with the correct value for the myArray[] query param', async () => {
        await request.get('/openapi-validation-on-explicit-query-arrays', 204, {
          headers: {
            'custom-header': 'hi',
          },
          query: {
            'myArray[]': ['a', 'b', 'c'],
          },
        })
      })

      it('fails with the incorrect value for the myArray[] query param', async () => {
        await request.get('/openapi-validation-on-explicit-query-arrays', 400, {
          headers: {
            'custom-header': 'hi',
          },
          query: {
            'myArray[]': ['a', 'b', 'd'],
          },
        })
      })
    })

    context('explicit array field without array brackets in query', () => {
      it('succeeds with the correct value for the myArray query param', async () => {
        await request.get('/openapi-validation-on-explicit-query-arrays-without-brackets', 204, {
          headers: {
            'custom-header': 'hi',
          },
          query: {
            myArray: ['a', 'b', 'c'],
          },
        })
      })

      it('fails with the incorrect value for the myArray query param', async () => {
        await request.get('/openapi-validation-on-explicit-query-arrays-without-brackets', 400, {
          headers: {
            'custom-header': 'hi',
          },
          query: {
            myArray: ['a', 'b', 'd'],
          },
        })
      })
    })
  })
})
