import pluralize from 'pluralize'
import Association from 'src/dream/association'
import db from 'src/singletons/db'
import config from 'src/singletons/config'

export default class HasOneThrough extends Association {
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
    this._association = associationResourceName
    this._through = through
  }

  async query(id) {
    const query = db
      .select(`${this.associationTable}.*`)
      .from(this.associationTable)
      .join(this.baseTable, `${this.baseTable}.id = ${id}`)

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
