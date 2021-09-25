import camelCase from 'src/helpers/camelCase'

export default class Dirty {
  hasUnsavedAttribute(attributeName) {
    if (this.isNewRecord) return true

    if (this.originalAttributes[attributeName])
      return this.originalAttributes[attributeName] !== this.attribute(attributeName)

    if (!this.originalAttributes[attributeName] && this.attribute(attributeName) !== undefined)
      return true

    return false
  }

  _defineDirtyAccessors() {
    Object.keys(this.constructor.schema).forEach(attributeName => {
      const camelCased = camelCase(attributeName)
      const key = `${camelCased}HasUnsavedChanges`
      Object.defineProperty(this, key, {
        get: () => this.hasUnsavedAttribute(attributeName),
        configurable: true,
      })
    })
  }
}
