import pluralize from 'pluralize'

export default function inflections() {
  pluralize.addUncountableRule('paper')
}
