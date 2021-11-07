import Association from 'src/dream/association'
import db from 'src/db'
import config from 'src/config'

export default class HasOne extends Association {
  get base() {
    return this._base
  }

  get baseTable() {
    return config.tableSchema(this.base).name
  }

  get associationDreamClass() {
    return config.dream(this.resourceName)
  }

  get associationTable() {
    return config.tableSchema(this.resourceName).name
  }

  get idField() {
    return this.associationDreamClass.idField
  }

  constructor(resourceName, associationResourceName, {
    foreignKey,
  }) {
    super()
    this._base = resourceName
    this._resourceName = associationResourceName
    this._foreignKey = foreignKey
  }

  async query(id) {
    return db
      .select('*')
      .from(this.associationTable)
      .where({ [this.foreignKey]: id })
      .first()
  }

  applyToHasOne(query, associationForeignKey) {
    return query.join(
      this.associationTable,
      `${this.associationTable}.${this.foreignKey} = ${this.baseTable}.${this.idField}`
    )
  }
}
