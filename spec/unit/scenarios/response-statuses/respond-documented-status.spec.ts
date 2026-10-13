import { specRequest as request } from '@rvoh/psychic-spec-helpers'
import { MockInstance } from 'vitest'
import { PsychicServer } from '../../../../src/package-exports/index.js'
import PsychicApp from '../../../../src/psychic-app/index.js'

// the actions are in test-app/src/app/controllers/ResponseStatusesController.ts
describe('a visitor hits a route that answers with this.respond(...)', () => {
  let logWithLevelSpy: MockInstance

  beforeEach(async () => {
    logWithLevelSpy = vi.spyOn(PsychicApp, 'logWithLevel')
    await request.init(PsychicServer)
  })

  function errorLogs(): unknown[] {
    return logWithLevelSpy.mock.calls
      .filter(([level]) => level === 'error')
      .map(([, message]): unknown => message)
  }

  context('on an endpoint whose @OpenAPI() has no model, view model, serializer or status', () => {
    it('answers the 204 the OpenAPI document shows, with no body', async () => {
      const res = await request.get('/respond-documented-no-content', 204)
      expect(res.text).toEqual('')
      expect(res.headers['content-type']).toBeUndefined()
      expect(errorLogs()).toEqual([])
    })

    it.each([
      ['data', '/respond-documented-no-content-with-data', 'respondDocumentedNoContentWithData'],
      ['null', '/respond-documented-no-content-with-null', 'respondDocumentedNoContentWithNull'],
    ])(
      'given %s, answers a 500 and logs an error naming the cause, instead of dropping it',
      async (_, path, action) => {
        const res = await request.get(path, 500)
        expect(res.text).toEqual('')
        expect(errorLogs()).toEqual([
          expect.stringMatching(
            new RegExp(
              `204 No Content, which cannot carry a body[\\s\\S]*controller: ResponseStatusesController\\s+action: ${action}`,
            ),
          ),
        ])
      },
    )
  })

  context('on an endpoint whose responses declare only a 201', () => {
    it('answers 201 with the data', async () => {
      const res = await request.get('/respond-documented-created', 201)
      expect(res.body).toEqual({ id: '1' })
    })
  })

  context("in an app whose OpenAPI document's defaults.responses adds a 200 to every endpoint", () => {
    beforeEach(() => {
      const psychicApp = PsychicApp.getOrFail()
      const settings = psychicApp.openapi.default!
      psychicApp.set('openapi', 'default', {
        ...settings,
        defaults: {
          ...settings.defaults,
          responses: {
            ...settings.defaults?.responses,
            200: {
              description: 'ok',
              content: { 'application/json': { schema: { type: 'object' } } },
            },
          },
        },
      })
    })

    context('on an endpoint whose @OpenAPI() has no model, view model, serializer or status', () => {
      it('answers the documented 200 with the data, which the document validates', async () => {
        const res = await request.get('/respond-documented-no-content-with-data', 200)
        expect(res.body).toEqual({ any: 'data' })
        expect(errorLogs()).toEqual([])
      })

      it('answers the documented 200 with {} when given no data', async () => {
        const res = await request.get('/respond-documented-no-content', 200)
        expect(res.body).toEqual({})
        expect(errorLogs()).toEqual([])
      })
    })
  })
})
