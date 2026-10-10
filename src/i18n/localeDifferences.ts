import { placeholderNames } from './placeholders.js'

/**
 * Compares every locale in `allLocales` with the base locale at
 * `singleLocaleKey` and returns one readable line per difference; an empty
 * list means every locale matches. See `I18nProvider.localeDifferences`.
 */
export default function localeDifferences(
  allLocales: Record<string, unknown>,
  singleLocaleKey: string,
): string[] {
  const base = allLocales[singleLocaleKey]
  if (!isTranslationObject(base)) {
    return [`${singleLocaleKey} is ${describeValue(base)}, not an object of translations`]
  }

  const differences: string[] = []

  for (const localeKey of Object.keys(allLocales)) {
    if (localeKey === singleLocaleKey) continue

    const locale = allLocales[localeKey]
    if (!isTranslationObject(locale)) {
      differences.push(`${localeKey} is ${describeValue(locale)}, not an object of translations`)
      continue
    }

    compareTranslationObjects(base, locale, [], { singleLocaleKey, localeKey, differences })
  }

  return differences
}

interface ComparisonContext {
  singleLocaleKey: string
  localeKey: string
  differences: string[]
}

function compareTranslationObjects(
  base: Record<string, unknown>,
  locale: Record<string, unknown>,
  path: string[],
  context: ComparisonContext,
) {
  const { singleLocaleKey, localeKey, differences } = context

  for (const key of Object.keys(base)) {
    const keyPath = [...path, key]
    if (!Object.hasOwn(locale, key)) {
      differences.push(`${localeKey} is missing "${keyPath.join('.')}"`)
      continue
    }
    compareValues(base[key], locale[key], keyPath, context)
  }

  for (const key of Object.keys(locale)) {
    if (Object.hasOwn(base, key)) continue
    differences.push(`${localeKey} has "${[...path, key].join('.')}", which ${singleLocaleKey} does not`)
  }
}

function compareValues(baseValue: unknown, localeValue: unknown, path: string[], context: ComparisonContext) {
  const { singleLocaleKey, localeKey, differences } = context
  const dottedPath = path.join('.')

  if (isTranslationObject(baseValue) && isTranslationObject(localeValue)) {
    compareTranslationObjects(baseValue, localeValue, path, context)
    return
  }

  if (typeof baseValue === 'string' && typeof localeValue === 'string') {
    const basePlaceholders = describePlaceholders(baseValue)
    const localePlaceholders = describePlaceholders(localeValue)
    if (basePlaceholders !== localePlaceholders) {
      differences.push(
        `${localeKey} uses ${localePlaceholders} at "${dottedPath}", where ${singleLocaleKey} uses ${basePlaceholders}`,
      )
    }
    return
  }

  const baseDescription = describeValue(baseValue)
  const localeDescription = describeValue(localeValue)
  if (baseDescription === localeDescription) return

  differences.push(
    `${localeKey} has ${localeDescription} at "${dottedPath}", where ${singleLocaleKey} has ${baseDescription}`,
  )
}

// Placeholders are compared as a set, so order and repetition do not count as
// differences. Names are read with the grammar `provide` replaces them by
// (`%{` + a name without braces + `}`), so literal brace text is not a
// placeholder.
function describePlaceholders(translation: string) {
  const names = [...placeholderNames(translation)]
  if (names.length === 0) return 'no placeholders'
  return names
    .sort()
    .map(name => `%{${name}}`)
    .join(', ')
}

function describeValue(value: unknown) {
  if (value === null) return 'null'
  if (value === undefined) return 'undefined'
  if (Array.isArray(value)) return 'an array'
  if (typeof value === 'object') return 'an object'
  return `a ${typeof value}`
}

export function isTranslationObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
