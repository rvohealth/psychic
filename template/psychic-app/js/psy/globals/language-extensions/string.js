import pluralize from 'psychic/helpers/pluralize'
import capitalize from 'psychic/helpers/capitalize'
import uncapitalize from 'psychic/helpers/uncapitalize'
import camelCase from 'psychic/helpers/camelCase'
import paramCase from 'psychic/helpers/paramCase'
import pascalCase from 'psychic/helpers/pascalCase'
import snakeCase from 'psychic/helpers/snakeCase'

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


