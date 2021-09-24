import Association from 'src/dream/association'
import db from 'src/db'
import config from 'src/singletons/config'

export default class HasOne extends Association {
  get base() {
    return this._base
  }

  get baseTable() {
    return config.tableSchema(this.base).name
  }

  get association() {
    return this._association
  }

  get associationDreamClass() {
    return config.dream(this.association)
  }

  get associationTable() {
    return config.tableSchema(this.association).name
  }

  constructor(resourceName, associationResourceName, {
    foreignKey,
  }) {
    super()
    this._base = resourceName
    this._association = associationResourceName
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
    return query.join(this.associationTable, `${this.associationTable}.${this.foreignKey} = ${this.baseTable}.id`)
  }
}
