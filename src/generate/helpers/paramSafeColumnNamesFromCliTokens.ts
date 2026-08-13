import parseAttribute from './parseAttribute.js'

/**
 * Derive the param-safe column names from the `columnsWithTypes` CLI tokens
 * supplied to `psy g:resource`. Filters the same set Dream's
 * `defaultParamSafeColumns()` filters at runtime — accepted deliberate
 * duplication, since the generator runs before a live model class exists
 * (greenfield) and therefore cannot introspect one.
 *
 * Delegates token parsing + camelCase normalization to the shared
 * `parseAttribute` helper so the casing emitted into generated controllers
 * matches what every other generator emits. Then drops the additional
 * reserved names that `parseAttribute` does not filter on its own.
 *
 * Omits:
 *   - Reserved camelCase names: `id`, `createdAt`, `updatedAt`, `deletedAt`, `type`
 *   - Type annotation `:belongs_to` (foreign keys)
 *   - Name suffix `_type` (polymorphic type discriminators)
 *   - Name suffix `_id` (polymorphic foreign keys)
 */
export default function paramSafeColumnNamesFromCliTokens(tokens: string[]): string[] {
  const reserved = new Set(['id', 'createdAt', 'updatedAt', 'deletedAt', 'type'])
  const safe: string[] = []
  for (const token of tokens) {
    const parsed = parseAttribute(token)
    if (!parsed) continue
    if (parsed.attributeType === 'belongs_to') continue
    if (reserved.has(parsed.attributeName)) continue
    safe.push(parsed.attributeName)
  }
  return safe
}
