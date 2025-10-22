import { OpenapiValidateOption } from '../../../src/openapi-renderer/endpoint.js'
import { PsychicApp } from '../../../src/package-exports/index.js'

function mockValidationValue(val: OpenapiValidateOption) {
  vi.spyOn(PsychicApp.prototype, 'openapi', 'get').mockReturnValue({
    default: { validate: val, outputFilepath: '' },
  })
}

describe('PsychicApp#openapiValidationIsActive', () => {
  context('undefined', () => {
    beforeEach(() => {
      mockValidationValue(undefined as unknown as OpenapiValidateOption)
    })

    it('returns false for headers', () => {
      expect(PsychicApp.getOrFail().openapiValidationIsActive('default', 'headers')).toBe(false)
    })

    it('returns false for requestBody', () => {
      expect(PsychicApp.getOrFail().openapiValidationIsActive('default', 'requestBody')).toBe(false)
    })

    it('returns false for responseBody', () => {
      expect(PsychicApp.getOrFail().openapiValidationIsActive('default', 'responseBody')).toBe(false)
    })

    it('returns false for query', () => {
      expect(PsychicApp.getOrFail().openapiValidationIsActive('default', 'query')).toBe(false)
    })
  })

  context('all: true', () => {
    beforeEach(() => {
      mockValidationValue({ all: true })
    })

    it('returns true for headers', () => {
      expect(PsychicApp.getOrFail().openapiValidationIsActive('default', 'headers')).toBe(true)
    })

    it('returns true for requestBody', () => {
      expect(PsychicApp.getOrFail().openapiValidationIsActive('default', 'requestBody')).toBe(true)
    })

    it('returns true for responseBody', () => {
      expect(PsychicApp.getOrFail().openapiValidationIsActive('default', 'responseBody')).toBe(true)
    })

    it('returns true for query', () => {
      expect(PsychicApp.getOrFail().openapiValidationIsActive('default', 'query')).toBe(true)
    })
  })

  context('all: false', () => {
    beforeEach(() => {
      mockValidationValue({ all: false })
    })

    it('returns false for headers', () => {
      expect(PsychicApp.getOrFail().openapiValidationIsActive('default', 'headers')).toBe(false)
    })

    it('returns false for requestBody', () => {
      expect(PsychicApp.getOrFail().openapiValidationIsActive('default', 'requestBody')).toBe(false)
    })

    it('returns false for responseBody', () => {
      expect(PsychicApp.getOrFail().openapiValidationIsActive('default', 'responseBody')).toBe(false)
    })

    it('returns false for query', () => {
      expect(PsychicApp.getOrFail().openapiValidationIsActive('default', 'query')).toBe(false)
    })
  })

  context('query: true', () => {
    beforeEach(() => {
      mockValidationValue({ query: true })
    })

    it('returns false for headers', () => {
      expect(PsychicApp.getOrFail().openapiValidationIsActive('default', 'headers')).toBe(false)
    })

    it('returns false for requestBody', () => {
      expect(PsychicApp.getOrFail().openapiValidationIsActive('default', 'requestBody')).toBe(false)
    })

    it('returns false for responseBody', () => {
      expect(PsychicApp.getOrFail().openapiValidationIsActive('default', 'responseBody')).toBe(false)
    })

    it('returns true for query', () => {
      expect(PsychicApp.getOrFail().openapiValidationIsActive('default', 'query')).toBe(true)
    })
  })

  context('requestBody: true', () => {
    beforeEach(() => {
      mockValidationValue({ requestBody: true })
    })

    it('returns false for headers', () => {
      expect(PsychicApp.getOrFail().openapiValidationIsActive('default', 'headers')).toBe(false)
    })

    it('returns true for requestBody', () => {
      expect(PsychicApp.getOrFail().openapiValidationIsActive('default', 'requestBody')).toBe(true)
    })

    it('returns false for responseBody', () => {
      expect(PsychicApp.getOrFail().openapiValidationIsActive('default', 'responseBody')).toBe(false)
    })

    it('returns false for query', () => {
      expect(PsychicApp.getOrFail().openapiValidationIsActive('default', 'query')).toBe(false)
    })
  })

  context('responseBody: true', () => {
    beforeEach(() => {
      mockValidationValue({ responseBody: true })
    })

    it('returns false for headers', () => {
      expect(PsychicApp.getOrFail().openapiValidationIsActive('default', 'headers')).toBe(false)
    })

    it('returns false for requestBody', () => {
      expect(PsychicApp.getOrFail().openapiValidationIsActive('default', 'requestBody')).toBe(false)
    })

    it('returns true for responseBody', () => {
      expect(PsychicApp.getOrFail().openapiValidationIsActive('default', 'responseBody')).toBe(true)
    })

    it('returns false for query', () => {
      expect(PsychicApp.getOrFail().openapiValidationIsActive('default', 'query')).toBe(false)
    })
  })

  context('headers: true', () => {
    beforeEach(() => {
      mockValidationValue({ headers: true })
    })

    it('returns true for headers', () => {
      expect(PsychicApp.getOrFail().openapiValidationIsActive('default', 'headers')).toBe(true)
    })

    it('returns false for requestBody', () => {
      expect(PsychicApp.getOrFail().openapiValidationIsActive('default', 'requestBody')).toBe(false)
    })

    it('returns false for responseBody', () => {
      expect(PsychicApp.getOrFail().openapiValidationIsActive('default', 'responseBody')).toBe(false)
    })

    it('returns false for query', () => {
      expect(PsychicApp.getOrFail().openapiValidationIsActive('default', 'query')).toBe(false)
    })
  })
})
