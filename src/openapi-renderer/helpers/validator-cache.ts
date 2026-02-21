import { ValidateFunction } from 'ajv'

/**
 * @internal
 *
 * Cache for compiled AJV validator functions.
 * Eliminates redundant schema compilation on every request by storing
 * validators keyed by controller, action, openapiName, and validation target.
 */
const _validatorCache: Record<string, ValidateFunction> = {}

/**
 * @internal
 *
 * Retrieves a cached validator function if it exists.
 *
 * @param cacheKey - The cache key identifying the validator
 * @returns The cached validator function, or undefined if not found
 */
export function getCachedValidator(cacheKey: string): ValidateFunction | undefined {
  return _validatorCache[cacheKey]
}

/**
 * @internal
 *
 * Stores a compiled validator function in the cache.
 *
 * @param cacheKey - The cache key identifying the validator
 * @param validator - The compiled AJV validator function to cache
 */
export function cacheValidator(cacheKey: string, validator: ValidateFunction): void {
  _validatorCache[cacheKey] = validator
}

/**
 * @internal
 *
 * Clears a specific validator from the cache.
 * Used in test environments to ensure test isolation.
 *
 * @param cacheKey - The cache key identifying the validator to clear
 */
export function _testOnlyClearValidator(cacheKey: string): void {
  delete _validatorCache[cacheKey]
}

/**
 * @internal
 *
 * Clears all validators from the cache.
 * Used in test environments to ensure test isolation.
 */
export function _testOnlyClearValidatorCache(): void {
  Object.keys(_validatorCache).forEach(key => {
    delete _validatorCache[key]
  })
}
