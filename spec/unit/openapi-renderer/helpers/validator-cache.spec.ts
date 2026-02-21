import { ValidateFunction } from 'ajv'
import {
  _testOnlyClearValidator,
  _testOnlyClearValidatorCache,
  cacheValidator,
  getCachedValidator,
} from '../../../../src/openapi-renderer/helpers/validator-cache.js'

describe('validator-cache', () => {
  afterEach(() => {
    _testOnlyClearValidatorCache()
  })

  function createMockValidator(returnValue: boolean): ValidateFunction {
    const validator = (() => returnValue) as unknown as ValidateFunction
    return validator
  }

  describe('getCachedValidator', () => {
    it('returns undefined when validator is not cached', () => {
      expect(getCachedValidator('nonexistent-key')).toBeUndefined()
    })

    it('returns cached validator when it exists', () => {
      const mockValidator = createMockValidator(true)
      cacheValidator('test-key', mockValidator)

      expect(getCachedValidator('test-key')).toBe(mockValidator)
    })
  })

  describe('cacheValidator', () => {
    it('stores validator in cache', () => {
      const mockValidator = createMockValidator(true)
      cacheValidator('test-key', mockValidator)

      expect(getCachedValidator('test-key')).toBe(mockValidator)
    })

    it('overwrites existing cached validator with same key', () => {
      const validator1 = createMockValidator(true)
      const validator2 = createMockValidator(false)

      cacheValidator('test-key', validator1)
      expect(getCachedValidator('test-key')).toBe(validator1)

      cacheValidator('test-key', validator2)
      expect(getCachedValidator('test-key')).toBe(validator2)
    })

    it('stores multiple validators with different keys', () => {
      const validator1 = createMockValidator(true)
      const validator2 = createMockValidator(false)

      cacheValidator('key-1', validator1)
      cacheValidator('key-2', validator2)

      expect(getCachedValidator('key-1')).toBe(validator1)
      expect(getCachedValidator('key-2')).toBe(validator2)
    })
  })

  describe('_testOnlyClearValidator', () => {
    it('clears specific validator from cache', () => {
      const validator1 = createMockValidator(true)
      const validator2 = createMockValidator(false)

      cacheValidator('key-1', validator1)
      cacheValidator('key-2', validator2)

      _testOnlyClearValidator('key-1')

      expect(getCachedValidator('key-1')).toBeUndefined()
      expect(getCachedValidator('key-2')).toBe(validator2)
    })

    it('does not throw when clearing non-existent key', () => {
      expect(() => _testOnlyClearValidator('nonexistent-key')).not.toThrow()
    })
  })

  describe('_testOnlyClearValidatorCache', () => {
    it('clears all validators from cache', () => {
      const validator1 = createMockValidator(true)
      const validator2 = createMockValidator(false)
      const validator3 = createMockValidator(true)

      cacheValidator('key-1', validator1)
      cacheValidator('key-2', validator2)
      cacheValidator('key-3', validator3)

      _testOnlyClearValidatorCache()

      expect(getCachedValidator('key-1')).toBeUndefined()
      expect(getCachedValidator('key-2')).toBeUndefined()
      expect(getCachedValidator('key-3')).toBeUndefined()
    })

    it('does not throw when cache is already empty', () => {
      expect(() => _testOnlyClearValidatorCache()).not.toThrow()
    })
  })
})
