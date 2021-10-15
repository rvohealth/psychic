import snakeCase from 'src/helpers/snakeCase'

export default function paramCase(str) {
  return snakeCase(str)
    .replace(/_/g, '-')
    .replace(/([A-Z][a-z]+)/g, str => '-' + str.uncapitalize())
    .replace(/^[-]/, '')
}
