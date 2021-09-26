import pluralize from 'pluralize'

export default class Association {
  get defaultForeignKey() {
    return pluralize.singular(this.associationTable) + '_id'
  }

  get foreignKey() {
    return this._foreignKey || this.defaultForeignKey
  }

  get resourceName() {
    return this._resourceName
  }
}
