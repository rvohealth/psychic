import pluralize from 'pluralize'

export default class Association {
  get foreignKey() {
    return this._foreignKey || this.defaultForeignKey
  }

  get defaultForeignKey() {
    return pluralize.singular(this.associationTable) + '_id'
  }
}
