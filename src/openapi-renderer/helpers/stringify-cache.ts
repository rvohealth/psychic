/**
 * @internal
 *
 * Cache for compiled fast-json-stringify functions.
 * Eliminates redundant schema compilation on every request by storing
 * stringify functions keyed by controller, action, openapiName, and status code.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const _stringifyCache: Record<string, ((data: any) => string) | undefined> = {}

/**
 * @internal
 *
 * Retrieves a cached stringify function if it exists.
 *
 * @param cacheKey - The cache key identifying the stringify function
 * @returns The cached stringify function, or undefined if not found
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getCachedStringify(cacheKey: string): ((data: any) => string) | undefined {
  return _stringifyCache[cacheKey]
}

/**
 * @internal
 *
 * Stores a compiled stringify function in the cache.
 *
 * @param cacheKey - The cache key identifying the stringify function
 * @param stringifyFn - The compiled fast-json-stringify function to cache
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function cacheStringify(cacheKey: string, stringifyFn: (data: any) => string): void {
  _stringifyCache[cacheKey] = stringifyFn
}

/**
 * @internal
 *
 * Clears a specific stringify function from the cache.
 * Used in test environments to ensure test isolation.
 *
 * @param cacheKey - The cache key identifying the stringify function to clear
 */
export function _testOnlyClearStringify(cacheKey: string): void {
  delete _stringifyCache[cacheKey]
}

/**
 * @internal
 *
 * Clears all stringify functions from the cache.
 * Used in test environments to ensure test isolation.
 */
export function _testOnlyClearStringifyCache(): void {
  Object.keys(_stringifyCache).forEach(key => {
    delete _stringifyCache[key]
  })
}
