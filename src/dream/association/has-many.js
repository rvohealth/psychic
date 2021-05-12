import pluralize from 'pluralize'
import Association from 'src/dream/association'
import db from 'src/db'
import config from 'src/config'

export default class HasMany extends Association {
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
    return config.dream(pluralize.singular(this.association))
  }

  get associationTable() {
    return config.tableSchema(this.association).name
  }

  get foreignKey() {
    return this._foreignKey
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
    const results = await db
      .select('*')
      .from(this.associationTable)
      .where({ [this.foreignKey]: id })
      .all()
    return results
  }
}
