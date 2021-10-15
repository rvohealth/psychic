import capitalize from 'src/helpers/capitalize'
import uncapitalize from 'src/helpers/uncapitalize'
import paramCase from 'src/helpers/paramCase'
import pascalCase from 'src/helpers/pascalCase'

String.prototype.capitalize = function() {
  return capitalize(this)
}

String.prototype.hyphenize = function() {
  return paramCase(this)
}

String.prototype.pascalize = function() {
  return pascalCase(this)
}

String.prototype.uncapitalize = function() {
  return uncapitalize(this)
}
