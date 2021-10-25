import pluralize from 'pluralize'
import capitalize from 'src/helpers/capitalize'
import uncapitalize from 'src/helpers/uncapitalize'
import camelCase from 'src/helpers/camelCase'
import paramCase from 'src/helpers/paramCase'
import pascalCase from 'src/helpers/pascalCase'
import snakeCase from 'src/helpers/snakeCase'

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

String.prototype.uncapitalize = function() {
  return uncapitalize(this)
}

String.prototype.unpluralize = function() {
  return pluralize.singular(this)
}
