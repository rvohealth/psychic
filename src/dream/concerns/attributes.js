import camelCase from 'src/helpers/camelCase'
import { validatePresence, validateUnique } from 'src/helpers/validation'

class AttributesProvider {
  get attributes() {
    return this._attributes
  }

  get attributeNames() {
    return Object.keys(this._attributes)
  }

  get originalAttributes() {
    return this._originalAttributes
  }

  get schema() {
    return this.constructor.schema
  }

  get dirty() {
    return !!this.attributeNames.filter(name => this.hasUnsavedAttribute(name)).length
  }

  get dirtyAttributes() {
    return this.attributeNames
      .filter(name => this.hasUnsavedAttribute(name))
      .reduce((agg, name) => {
        agg[name] = this.attribute(name)
        return agg
      }, {})
  }

  attribute(name) {
    return this.attributes[name]
  }

  hasUnsavedAttribute(attributeName) {
    if (this.isNewRecord) return true

    if (this.originalAttributes[attributeName])
      return this.originalAttributes[attributeName] !== this.attribute(attributeName)

    if (!this.originalAttributes[attributeName] && this.attribute(attributeName) !== undefined)
      return true

    return false
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

  _resetAttributes(attributes) {
    this._attributes = attributes
    this._originalAttributes = { ...attributes }
    this._defineAttributeAccessors()
    this._defineDirtyAccessors()
  }
}

export default AttributesProvider
