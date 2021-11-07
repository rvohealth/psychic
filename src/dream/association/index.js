import Psyclass from 'src/psychic/psyclass'
import pluralize from 'pluralize'
import config from 'src/config'

export default class Association extends Psyclass {
  get defaultForeignKey() {
    return pluralize.singular(this.associationTable) + `_${this.idField}`
  }

  get foreignKey() {
    return this._foreignKey || this.defaultForeignKey
  }

  get resourceName() {
    return this._resourceName
  }
}
