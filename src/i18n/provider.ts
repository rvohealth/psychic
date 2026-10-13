import I18nDefaultLocales from './conf/I18nDefaultLocales.js'
import { DottedLanguageObjectStringPaths } from './conf/types.js'
import localeDifferences, { isTranslationObject } from './localeDifferences.js'
import { isPlaceholderName, placeholderPattern } from './placeholders.js'

const SUPPORTED_LOCALES = ['en-US']
export function supportedLocales() {
  return SUPPORTED_LOCALES
}

export default class I18nProvider {
  /**
   * Leverages the arguments provided to return to you an
   * i18n function, which will provide type completion based
   * on the locales set up in your application.
   *
   * @param allLocales - the list of all locales in your app. something like `{ en: { ... }, ['en-UK']: { ... }, es: { ... }, ... }`
   * @param singleLocaleKey - the key from the allLocales object that you want to use as your type base and
   * fallback locale. i.e. 'en'
   *
   * The returned function looks a translation up in the locale matching the
   * language of the locale it is given (`es` for `'es-ES'`), or in the base
   * locale (`singleLocaleKey`) when `allLocales` has no such language. A key
   * missing from the requested locale falls back to the base locale's
   * translation, interpolated the same way, and a key missing from both returns
   * the dotted key itself. To find the keys a locale is missing before a user
   * sees the fallback, call `I18nProvider.localeDifferences` from a spec.
   *
   * A placeholder is `%{`, a name containing neither `{` nor `}`, and a
   * closing `}`, so a literal `%{` with no closing brace stays as written.
   * Each `%{name}` with a supplied interpolation is replaced; one without is
   * left as written. An interpolation key containing a brace (`{` or `}`) can
   * never match a placeholder, and the i18n function throws for it, as it does
   * for an `undefined` or `null` value.
   *
   * Output-encoding note: interpolated values are substituted verbatim into the
   * translation string. There is no HTML escaping at this layer — Psychic emits
   * JSON, and the client renderer (React / Vue / Svelte / etc.) is responsible
   * for context-appropriate escaping when the translated string enters a DOM.
   * Do not pipe translated strings through `dangerouslySetInnerHTML` / `v-html` /
   * `{@html}`. For rich-text translations, use structured dictionaries instead
   * of HTML inside translation values. See `psychic-guides` → Security →
   * Output Encoding & i18n.
   * */
  public static provide<
    const AllLocales,
    const SingleLocaleKey extends keyof AllLocales & string,
    LocalesEnum extends string = (typeof I18nDefaultLocales)[number],
    SingleLocaleShape = AllLocales[SingleLocaleKey],
  >(allLocales: AllLocales, singleLocaleKey: SingleLocaleKey) {
    return function i18n(
      locale: LocalesEnum,
      i18nPathString: DottedLanguageObjectStringPaths<SingleLocaleShape> & string,
      interpolations?: Record<string, string | number>,
    ): string {
      const language = locale?.split('-')?.[0]
      const i18nPath = i18nPathString.split('.')
      const baseLocale: unknown = allLocales[singleLocaleKey]
      const requestedLocale: unknown =
        language !== undefined && Object.hasOwn(allLocales as object, language)
          ? allLocales[language as keyof AllLocales]
          : baseLocale

      const translation = findTranslation(requestedLocale, i18nPath) ?? findTranslation(baseLocale, i18nPath)
      if (translation === undefined) return i18nPathString

      return applyInterpolations(i18nPathString, translation, interpolations)
    }
  }

  /**
   * Compares every locale in `allLocales` with the base locale
   * (`singleLocaleKey`) and returns one readable line for each difference: a
   * key the locale is missing, a key the base locale lacks, a string where the
   * other has nested translations (reported once, at that key), and a
   * translation whose set of `%{…}` placeholders differs from the base's. An
   * empty list means every locale matches.
   *
   * Placeholders are read the way `provide` replaces them: `%{`, a name
   * containing neither `{` nor `}`, and a closing `}`. Literal braces that
   * are not part of a placeholder, such as `{link}` or ICU/JSON text, are not
   * compared.
   *
   * Psychic never runs this itself. Call it from a spec, with the same
   * arguments you pass to `provide`, so a CI run lists every difference:
   *
   * ```ts
   * expect(I18nProvider.localeDifferences(locales, 'en')).toEqual([])
   * ```
   *
   * @param allLocales - the same locales object you pass to `I18nProvider.provide`
   * @param singleLocaleKey - the same base locale key you pass to `I18nProvider.provide`. i.e. 'en'
   * @returns a list of differences, empty when every locale matches the base locale
   */
  public static localeDifferences<const AllLocales, const SingleLocaleKey extends keyof AllLocales & string>(
    allLocales: AllLocales,
    singleLocaleKey: SingleLocaleKey,
  ): string[] {
    return localeDifferences(allLocales as Record<string, unknown>, singleLocaleKey)
  }
}

function applyInterpolations(
  i18nPathString: string,
  str: string,
  interpolations?: Record<string, string | number>,
) {
  if (!interpolations) return str

  const replacements = new Map<string, string>()
  Object.keys(interpolations).forEach(key => {
    if (!isPlaceholderName(key)) throw new I18nInterpolationKeyContainsBrace(i18nPathString, key)

    const interpolationValue = interpolations[key]
    if (interpolationValue === undefined) throw new I18nInterpolationReceivedUndefined(i18nPathString, key)
    if (interpolationValue === null) throw new I18nInterpolationReceivedNull(i18nPathString, key)

    replacements.set(key, interpolationValue.toString())
  })

  if (replacements.size === 0) return str

  // A single pass over the translation's placeholders, each `%{` + a name
  // without braces + `}` (the grammar `localeDifferences` reads). The
  // replacer inserts each value verbatim, without expanding `$&`/`$'`/`$$`
  // patterns, and substituted text is never re-scanned, so a value containing
  // `%{other}` stays literal. Placeholders without a supplied value are left
  // as written.
  return str.replace(placeholderPattern(), (match, name: string) => replacements.get(name) ?? match)
}

// Resolves the full path: a string found before the last segment, or an object
// at the last one, is not a translation for the path.
function findTranslation(i18nObject: unknown, i18nPath: string[]): string | undefined {
  let node = i18nObject
  for (const segment of i18nPath) {
    if (!isTranslationObject(node) || !Object.hasOwn(node, segment)) return undefined
    node = node[segment]
  }
  return typeof node === 'string' ? node : undefined
}

// Not exported from the package: a key containing `{` or `}` can never match a
// placeholder, so passing one is a programmer error to fix, not to catch.
export class I18nInterpolationKeyContainsBrace extends Error {
  private i18nPathString: string
  private interpolationKey: string

  constructor(i18nPathString: string, interpolationKey: string) {
    super()
    Object.setPrototypeOf(this, I18nInterpolationKeyContainsBrace.prototype)
    this.i18nPathString = i18nPathString
    this.interpolationKey = interpolationKey
  }

  public override get message() {
    return `
interpolation key contains a brace ("{" or "}"), which a placeholder name cannot:
i18n path string: ${this.i18nPathString}
interpolationKey: ${this.interpolationKey}
    `
  }
}

export class I18nInterpolationReceivedUndefined extends Error {
  private i18nPathString: string
  private interpolationKey: string

  constructor(i18nPathString: string, interpolationKey: string) {
    super()
    Object.setPrototypeOf(this, I18nInterpolationReceivedUndefined.prototype)
    this.i18nPathString = i18nPathString
    this.interpolationKey = interpolationKey
  }

  public override get message() {
    return `
undefined interpolation value received:
i18n path string: ${this.i18nPathString}
interpolationKey: ${this.interpolationKey}
    `
  }
}

export class I18nInterpolationReceivedNull extends Error {
  private i18nPathString: string
  private interpolationKey: string

  constructor(i18nPathString: string, interpolationKey: string) {
    super()
    Object.setPrototypeOf(this, I18nInterpolationReceivedNull.prototype)
    this.i18nPathString = i18nPathString
    this.interpolationKey = interpolationKey
  }

  public override get message() {
    return `
null interpolation value received:
i18n path string: ${this.i18nPathString}
interpolationKey: ${this.interpolationKey}
    `
  }
}
