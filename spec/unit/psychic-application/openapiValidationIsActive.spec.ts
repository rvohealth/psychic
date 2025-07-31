import { PsychicApp } from '../../../src/index.js'
import { OpenapiValidateOption } from '../../../src/openapi-renderer/endpoint.js'

function mockValidationValue(val: OpenapiValidateOption) {
  vi.spyOn(PsychicApp.prototype, 'openapi', 'get').mockReturnValue({
    default: { validate: val, outputFilepath: '' },
  })
}

describe('PsychicApp#openapiValidationIsActive', () => {
  context('when set to a boolean', () => {
    context('true', () => {
      beforeEach(() => {
        mockValidationValue(true)
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

    context('false', () => {
      beforeEach(() => {
        mockValidationValue(false)
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

  context('array values', () => {
    context('["query"]', () => {
      beforeEach(() => {
        mockValidationValue(['query'])
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

    context('["requestBody"]', () => {
      beforeEach(() => {
        mockValidationValue(['requestBody'])
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

    context('["responseBody"]', () => {
      beforeEach(() => {
        mockValidationValue(['responseBody'])
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

    context('["responseBody", "requestBody"]', () => {
      beforeEach(() => {
        mockValidationValue(['responseBody', 'requestBody'])
      })

      it('returns true for requestBody', () => {
        expect(PsychicApp.getOrFail().openapiValidationIsActive('default', 'requestBody')).toBe(true)
      })

      it('returns true for responseBody', () => {
        expect(PsychicApp.getOrFail().openapiValidationIsActive('default', 'responseBody')).toBe(true)
      })

      it('returns false for query', () => {
        expect(PsychicApp.getOrFail().openapiValidationIsActive('default', 'query')).toBe(false)
      })
    })
  })
})
