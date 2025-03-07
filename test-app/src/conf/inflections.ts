import pluralize from 'pluralize-esm'

export default function inflections() {
  pluralize.addUncountableRule('paper')
}
