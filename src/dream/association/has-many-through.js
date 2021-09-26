import pluralize from 'pluralize'
import Association from 'src/dream/association'
import db from 'src/db'
import config from 'src/config'

export default class HasManyThrough extends Association {
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

  get throughKey() {
    // id of associated through
    return `${this.associationTable}.${pluralize.singular(this.through.associationTable)}_id`
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
      .join(this.baseTable, `${this.baseTable}.id = ${id}`)

    this.through.applyToHasOne(query, `${this.associationTable}.${pluralize.singular(this.through.associationTable)}_id`)

    return await query
      .all()
  }

  applyToHasOne(query) {
    this.through.applyToHasOne(query, this.throughKey)
    query.join(this.associationTable, `${this.throughKey}=${this.through.associationTable}.id`)
    return query
  }
}
