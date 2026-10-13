import { OpenapiValidateTarget } from '../../../../src/openapi-renderer/defaults.js'
import OpenapiEndpointRenderer, { OpenapiValidateOption } from '../../../../src/openapi-renderer/endpoint.js'
import PsychicApp from '../../../../src/psychic-app/index.js'
import UsersController from '../../../../test-app/src/app/controllers/UsersController.js'
import User from '../../../../test-app/src/app/models/User.js'

describe('OpenapiEndpointRenderer#shouldValidateOpenapiPayload', () => {
  function subject(
    openapiName: string,
    target: OpenapiValidateTarget,
    validate: OpenapiValidateOption | undefined,
    appValidationIsActive: boolean = false,
  ) {
    vi.spyOn(PsychicApp.prototype, 'openapiValidationIsActive').mockReturnValue(appValidationIsActive)

    const renderer = new OpenapiEndpointRenderer(User, UsersController, 'howyadoin', {
      description: 'hello',
      summary: 'world',
      validate,
    })
    return renderer['shouldValidateOpenapiPayload'](openapiName, target)
  }

  context('undefined', () => {
    it('returns false for headers', () => {
      expect(subject('default', 'headers', undefined)).toBe(false)
    })

    it('returns false for requestBody', () => {
      expect(subject('default', 'requestBody', undefined)).toBe(false)
    })

    it('returns false for responseBody', () => {
      expect(subject('default', 'responseBody', undefined)).toBe(false)
    })

    it('returns false for query', () => {
      expect(subject('default', 'query', undefined)).toBe(false)
    })
  })

  context('all: true', () => {
    it('returns true for headers', () => {
      expect(subject('default', 'headers', { all: true })).toBe(true)
    })

    it('returns true for requestBody', () => {
      expect(subject('default', 'requestBody', { all: true })).toBe(true)
    })

    it('returns true for responseBody', () => {
      expect(subject('default', 'responseBody', { all: true })).toBe(true)
    })

    it('returns true for query', () => {
      expect(subject('default', 'query', { all: true })).toBe(true)
    })
  })

  context('all: false, while validation is active at the app level', () => {
    it('returns false for headers', () => {
      expect(subject('default', 'headers', { all: false }, true)).toBe(false)
    })

    it('returns false for requestBody', () => {
      expect(subject('default', 'requestBody', { all: false }, true)).toBe(false)
    })

    it('returns false for responseBody', () => {
      expect(subject('default', 'responseBody', { all: false }, true)).toBe(false)
    })

    it('returns false for query', () => {
      expect(subject('default', 'query', { all: false }, true)).toBe(false)
    })
  })

  context('all: false with requestBody: true', () => {
    it('returns false for requestBody', () => {
      expect(subject('default', 'requestBody', { all: false, requestBody: true })).toBe(false)
    })
  })

  context('all: true with requestBody: false', () => {
    it('returns true for requestBody', () => {
      expect(subject('default', 'requestBody', { all: true, requestBody: false })).toBe(true)
    })
  })

  context('requestBody: false, while validation is active at the app level', () => {
    it('returns false for requestBody', () => {
      expect(subject('default', 'requestBody', { requestBody: false }, true)).toBe(false)
    })

    it('falls back to the app level for headers', () => {
      expect(subject('default', 'headers', { requestBody: false }, true)).toBe(true)
    })
  })

  context('undefined, while validation is active at the app level', () => {
    it('falls back to the app level', () => {
      expect(subject('default', 'requestBody', undefined, true)).toBe(true)
    })
  })

  context('query: true', () => {
    it('returns false for headers', () => {
      expect(subject('default', 'headers', { query: true })).toBe(false)
    })

    it('returns false for requestBody', () => {
      expect(subject('default', 'requestBody', { query: true })).toBe(false)
    })

    it('returns false for responseBody', () => {
      expect(subject('default', 'responseBody', { query: true })).toBe(false)
    })

    it('returns true for query', () => {
      expect(subject('default', 'query', { query: true })).toBe(true)
    })
  })

  context('requestBody: true', () => {
    it('returns false for headers', () => {
      expect(subject('default', 'headers', { requestBody: true })).toBe(false)
    })

    it('returns true for requestBody', () => {
      expect(subject('default', 'requestBody', { requestBody: true })).toBe(true)
    })

    it('returns false for responseBody', () => {
      expect(subject('default', 'responseBody', { requestBody: true })).toBe(false)
    })

    it('returns false for query', () => {
      expect(subject('default', 'query', { requestBody: true })).toBe(false)
    })
  })

  context('responseBody: true', () => {
    it('returns false for headers', () => {
      expect(subject('default', 'headers', { responseBody: true })).toBe(false)
    })

    it('returns false for requestBody', () => {
      expect(subject('default', 'requestBody', { responseBody: true })).toBe(false)
    })

    it('returns true for responseBody', () => {
      expect(subject('default', 'responseBody', { responseBody: true })).toBe(true)
    })

    it('returns false for query', () => {
      expect(subject('default', 'query', { responseBody: true })).toBe(false)
    })
  })

  context('headers: true', () => {
    it('returns true for headers', () => {
      expect(subject('default', 'headers', { headers: true })).toBe(true)
    })

    it('returns false for requestBody', () => {
      expect(subject('default', 'requestBody', { headers: true })).toBe(false)
    })

    it('returns false for responseBody', () => {
      expect(subject('default', 'responseBody', { headers: true })).toBe(false)
    })

    it('returns false for query', () => {
      expect(subject('default', 'query', { headers: true })).toBe(false)
    })
  })
})
