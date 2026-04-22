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
 */
export default function parseAttribute(attribute: string): ParsedAttribute | null {
  const [rawAttributeName, rawAttributeType, , enumValues] = attribute.split(':')

  if (!rawAttributeName || !rawAttributeType) return null

  const sanitizedAttrType = camelize(rawAttributeType)?.toLowerCase()

  // Handle belongs_to relationships
  if (sanitizedAttrType === 'belongsto') {
    // For belongs_to relationships, convert "Ticketing/Ticket" to "ticket"
    const attributeName = camelize(rawAttributeName.split('/').pop()!)
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
