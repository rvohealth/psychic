import { camelize } from '@rvoh/dream/utils'

export interface ParsedAttribute {
  attributeName: string
  attributeType: string
  isArray: boolean
  enumValues?: string | undefined
}

/**
 * Parse a `name:type[:enumName:enumValues]` CLI token into its camelCase
 * attribute name and metadata. Returns `null` for tokens that should be
 * dropped from the generated artifact (polymorphic `_type`/`_id` columns,
 * `deletedAt`, or malformed tokens missing a name or type).
 *
 * Centralized so generators (controller scaffolds, resource specs, the
 * paramSafe column allowlist) share one canonical interpretation of the
 * tokens — and one canonical casing (camelCase) for the resulting attribute
 * name.
 *
 * Supports the `Model@alias:belongs_to` shorthand for renaming the FK
 * association. When `@alias` is present, the camelized alias becomes
 * `attributeName`; otherwise (legacy form `Model:belongs_to`) the
 * attribute name is derived from the model's last namespace segment.
 *
 * Mirrors Dream's CLI-side `parseAttribute` (kept as a parallel
 * implementation rather than a shared import so neither package leaks an
 * internal CLI helper through its public API surface).
 */
export default function parseAttribute(attribute: string): ParsedAttribute | null {
  const segments = attribute.split(':')
  const rawSegmentOne = segments[0]
  const rawAttributeType = segments[1]

  if (!rawSegmentOne || !rawAttributeType) return null

  // Extract optional `@alias` from segment-1 (used by the belongs_to FK alias
  // shorthand, e.g., `InternalUser@canceled_by:belongs_to`).
  let rawAttributeName = rawSegmentOne
  let aliasName: string | undefined
  const atIndex = rawSegmentOne.indexOf('@')
  if (atIndex !== -1) {
    rawAttributeName = rawSegmentOne.slice(0, atIndex)
    const rawAlias = rawSegmentOne.slice(atIndex + 1)
    if (!rawAttributeName || !rawAlias) return null
    aliasName = rawAlias
  }

  // Pop trailing `optional` keyword from descriptors so it doesn't get
  // mistaken for enum values or other positional descriptors.
  const descriptors = segments.slice(2)
  if (descriptors[descriptors.length - 1] === 'optional') descriptors.pop()
  const enumValues = descriptors[1]

  const sanitizedAttrType = camelize(rawAttributeType)?.toLowerCase()

  // Handle belongs_to relationships
  if (sanitizedAttrType === 'belongsto') {
    // For belongs_to relationships, prefer the explicit alias when present;
    // otherwise convert "Ticketing/Ticket" → "ticket".
    const attributeName = aliasName ? camelize(aliasName) : camelize(rawAttributeName.split('/').pop()!)
    return { attributeName, attributeType: 'belongs_to', isArray: false, enumValues }
  }

  // Skip _type and _id columns, but not belongs_to relationships
  if (/(_type|_id)$/.test(rawAttributeName)) return null

  const attributeName = camelize(rawAttributeName)
  if (attributeName === 'deletedAt') return null

  const arrayBracketRegexp = /\[\]$/
  const isArray = arrayBracketRegexp.test(rawAttributeType)
  const _attributeType = rawAttributeType.replace(arrayBracketRegexp, '')
  const attributeType = /uuid$/.test(rawAttributeName) ? 'uuid' : _attributeType

  return { attributeName, attributeType, isArray, enumValues }
}
