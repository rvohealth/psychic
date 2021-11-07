import pluralize from 'pluralize'
import Association from 'src/dream/association'
import db from 'src/db'
import config from 'src/config'

export default class HasOneThrough extends Association {
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

  get throughKey() {
    // id of associated through
    return `${this.associationTable}.${pluralize.singular(this.through.associationTable)}_${this.through.idField}`
  }

  // note, through is stores as an association (i.e. HasMany, HasOne, etc...)
  get through() {
    return this._through
  }

  constructor(resourceName, associationResourceName, {
    through,
  }) {
    super()
    this._base = resourceName
    this._resourceName = associationResourceName
    this._through = through
  }

  async query(id) {
    const query = db
      .select(`${this.associationTable}.*`)
      .from(this.associationTable)
      .join(this.baseTable, `${this.baseTable}.${this.idField} = ${id}`)

    this.through.applyToHasOne(query, this.throughKey)

    return await query
      .first()
  }

  applyToHasOne(query, associationForeignKey) {
    query.join(this.associationTable, `${this.throughKey}=${associationForeignKey}`)
    this.through.applyToHasOne(query, this.throughKey)
    return query
  }
}
