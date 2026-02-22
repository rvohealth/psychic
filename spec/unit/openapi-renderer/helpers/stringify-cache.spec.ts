import {
  _testOnlyClearStringify,
  _testOnlyClearStringifyCache,
  cacheStringify,
  getCachedStringify,
} from '../../../../src/openapi-renderer/helpers/stringify-cache.js'

describe('stringify-cache', () => {
  afterEach(() => {
    _testOnlyClearStringifyCache()
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function createMockStringify(prefix: string): (data: any) => string {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data: any) => `${prefix}:${JSON.stringify(data)}`
  }

  describe('getCachedStringify', () => {
    it('returns undefined when stringify function is not cached', () => {
      expect(getCachedStringify('nonexistent-key')).toBeUndefined()
    })

    it('returns cached stringify function when it exists', () => {
      const mockStringify = createMockStringify('test')
      cacheStringify('test-key', mockStringify)

      expect(getCachedStringify('test-key')).toBe(mockStringify)
    })
  })

  describe('cacheStringify', () => {
    it('stores stringify function in cache', () => {
      const mockStringify = createMockStringify('test')
      cacheStringify('test-key', mockStringify)

      expect(getCachedStringify('test-key')).toBe(mockStringify)
    })

    it('overwrites existing cached stringify function with same key', () => {
      const stringify1 = createMockStringify('first')
      const stringify2 = createMockStringify('second')

      cacheStringify('test-key', stringify1)
      expect(getCachedStringify('test-key')).toBe(stringify1)

      cacheStringify('test-key', stringify2)
      expect(getCachedStringify('test-key')).toBe(stringify2)
    })

    it('stores multiple stringify functions with different keys', () => {
      const stringify1 = createMockStringify('first')
      const stringify2 = createMockStringify('second')

      cacheStringify('key-1', stringify1)
      cacheStringify('key-2', stringify2)

      expect(getCachedStringify('key-1')).toBe(stringify1)
      expect(getCachedStringify('key-2')).toBe(stringify2)
    })

    it('cached stringify function works correctly', () => {
      const mockStringify = createMockStringify('prefix')
      cacheStringify('test-key', mockStringify)

      const retrieved = getCachedStringify('test-key')
      expect(retrieved).toBeDefined()
      expect(retrieved!({ foo: 'bar' })).toBe('prefix:{"foo":"bar"}')
    })
  })

  describe('_testOnlyClearStringify', () => {
    it('clears specific stringify function from cache', () => {
      const stringify1 = createMockStringify('first')
      const stringify2 = createMockStringify('second')

      cacheStringify('key-1', stringify1)
      cacheStringify('key-2', stringify2)

      _testOnlyClearStringify('key-1')

      expect(getCachedStringify('key-1')).toBeUndefined()
      expect(getCachedStringify('key-2')).toBe(stringify2)
    })

    it('does not throw when clearing non-existent key', () => {
      expect(() => _testOnlyClearStringify('nonexistent-key')).not.toThrow()
    })
  })

  describe('_testOnlyClearStringifyCache', () => {
    it('clears all stringify functions from cache', () => {
      const stringify1 = createMockStringify('first')
      const stringify2 = createMockStringify('second')
      const stringify3 = createMockStringify('third')

      cacheStringify('key-1', stringify1)
      cacheStringify('key-2', stringify2)
      cacheStringify('key-3', stringify3)

      _testOnlyClearStringifyCache()

      expect(getCachedStringify('key-1')).toBeUndefined()
      expect(getCachedStringify('key-2')).toBeUndefined()
      expect(getCachedStringify('key-3')).toBeUndefined()
    })

    it('does not throw when cache is already empty', () => {
      expect(() => _testOnlyClearStringifyCache()).not.toThrow()
    })
  })
})
