import camelCase from 'src/helpers/camelCase'
import { validatePresence, validateUnique } from 'src/helpers/validation'

export default class AttributesProvider {
  attribute(name) {
    return this.attributes[name]
  }

  setAttributes(attributes) {
    Object.keys(attributes).forEach(attr => {
      this[attr] = attributes[attr]
    })
  }

  _defineAttributeAccessors() {
    Object.keys(this.constructor.schema).forEach(attributeName => {
      const camelCased = camelCase(attributeName)

      const attrAccessors = {
        get: () => this.attribute(attributeName),
        set: val => {
          this._attributes[attributeName] = val
        },
        configurable: true,
      }

      Object.defineProperty(this, attributeName, attrAccessors)
      if (camelCased !== attributeName)
        Object.defineProperty(this, camelCased, attrAccessors)

      const attrIsPresentAccessors = {
        get: () => {
          return validatePresence(this.table, attributeName, this[attributeName])
        },
        configurable: true,
      }

      Object.defineProperty(this, `${attributeName}IsPresent`, attrIsPresentAccessors)
      if (camelCased !== attributeName)
        Object.defineProperty(this, `${camelCased}IsPresent`, attrIsPresentAccessors)

      const attrIsUnique = async () => {
        return await validateUnique(this.constructor, attributeName, this[attributeName])
      }

      this[attributeName + 'IsUnique'] = attrIsUnique
      if (camelCased !== attributeName)
        this[camelCased + 'IsUnique'] = attrIsUnique
    })
  }

  _resetAttributes(attributes) {
    this._attributes = attributes
    this._originalAttributes = { ...attributes }
    this._defineAttributeAccessors()
    this._defineDirtyAccessors()
  }
}
