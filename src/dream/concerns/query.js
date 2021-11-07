import Query from 'src/db/query'
import db from 'src/db'
import snakeCase from 'src/helpers/snakeCase'
import Collection from 'src/dream/collection'

const QueryProvider = superclass => class extends superclass {
  static async all() {
    const results = await Query.new(this)
      .select('*')
      .from(this.table)
      .all()

    return new Collection(this, results)
  }

  static async count() {
    return await db.count(this.table).do()
  }

  static async create(attributes) {
    const newRecord = new this(attributes)
    return await newRecord.save()
  }

  static async find(id) {
    return Query.new(this)
      .select('*')
      .from(this.table)
      .where({ [this.idField]: id })
      .first()
  }

  static async findBy(obj) {
    return Query.new(this)
      .select('*')
      .from(this.table)
      .where(obj)
      .first()
  }

  static async first() {
    const result = await Query.new(this)
      .select('*')
      .from(this.table)
      .first()

    if (result) return result
    return null
  }

  static select(...fields) {
    return new Query(this)
      .select(...fields)
      .from(this.table)
  }

  static where(...fields) {
    return new Query(this)
      .select('*')
      .from(this.table)
      .where(...fields)
  }

  async destroy() {
    await this._runHooksFor('beforeDestroy')

    await db
      .delete(this.table)
      .where({ [this.idField]: this.id })
      .do()

    await this._runHooksFor('afterDestroy')
    return true
  }

  async save() {
    await this._runHooksFor('beforeSave')
    await this._runValidations()

    if (this.isNewRecord) {
      await this._runHooksFor('beforeCreate')

      const newModel = new this.constructor(
        await db.insert(this.table, snakeCase({ ...this.dirtyAttributes }))
      )
      this._resetAttributes(newModel.attributes)

      await this._runHooksFor('afterCreate')

    } else {
      await this._runHooksFor('beforeUpdate')

      const results = await db
        .update(this.table, { ...this.dirtyAttributes })
        .where({ [this.idField]: this.id })
        .do()

      this._resetAttributes(results[0])

      await this._runHooksFor('afterUpdate')
    }

    await this._runHooksFor('afterSave')

    return this
  }

  async update(attributes) {
    this.setAttributes(attributes)
    return await this.save()
  }
}

export default QueryProvider
