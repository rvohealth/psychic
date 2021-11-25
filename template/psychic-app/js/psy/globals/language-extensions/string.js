import {
  camelCase,
  capitalize,
  paramCase,
  pascalCase,
  pluralize,
  snakeCase,
  uncapitalize,
} from 'psychic/helpers'

String.prototype.capitalize = function() {
  return capitalize(this)
}

String.prototype.camelize = function() {
  return camelCase(this)
}

String.prototype.hyphenize = function() {
  return paramCase(this)
}

String.prototype.pascalize = function() {
  return pascalCase(this)
}

String.prototype.pluralize = function() {
  return pluralize(this)
}

String.prototype.snakeify = function() {
  return snakeCase(this)
}

String.prototype.singular = function() {
  return pluralize.singular(this)
}

String.prototype.singularize = function() {
  return this.singular()
}

String.prototype.uncapitalize = function() {
  return uncapitalize(this)
}

String.prototype.unpluralize = function() {
  return pluralize.singular(this)
}

Object.defineProperty(String.prototype, 'presence', {
  get: function() {
    const denylist = ['', null, undefined]
    return denylist.includes(this) ? null : this
  },
  configurable: true,
})


