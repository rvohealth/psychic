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

  get associationDreamClass() {
    return config.dream(pluralize.singular(this.resourceName))
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
    const results = await db
      .select('*')
      .from(this.associationTable)
      .where({ [this.foreignKey]: id })
      .all()
    return results
  }
}
