// The one placeholder grammar shared by `I18nProvider.provide` and
// `I18nProvider.localeDifferences`: a placeholder is `%{`, a name containing
// neither `{` nor `}`, and a closing `}`. Text such as `{link}` that does not
// start with `%{` is not a placeholder, and a literal `%{` with no `}` before
// the next brace stays literal without swallowing a later placeholder.
// Internal to Psychic; not part of the package's public API.

// Returns a fresh global pattern each call, since a global RegExp is stateful.
// Group 1 is the placeholder name, which may be empty (`%{}`).
export function placeholderPattern() {
  return /%\{([^{}]*)\}/g
}

// Whether `name` can appear as a placeholder name under this grammar.
export function isPlaceholderName(name: string) {
  return !name.includes('{') && !name.includes('}')
}

export function placeholderNames(translation: string) {
  return new Set([...translation.matchAll(placeholderPattern())].map(match => match[1] as string))
}
