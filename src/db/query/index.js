import PostgresAdapter from 'src/db/adapter/postgres'
import InvalidWhereClause from 'src/error/db/invalid-where-clause'
import InvalidFromClause from 'src/error/db/invalid-from-clause'
import InvalidGroupClause from 'src/error/db/invalid-group-clause'
import InvalidHavingClause from 'src/error/db/invalid-having-clause'
import InvalidOrderClause from 'src/error/db/invalid-order-clause'
import InvalidLimitClause from 'src/error/db/invalid-limit-clause'
import InvalidOffsetClause from 'src/error/db/invalid-offset-clause'
import InvalidFetchClause from 'src/error/db/invalid-fetch-clause'

export default class Query {
  constructor(dreamClass=null) {
    this._dreamClass = dreamClass
    this._count = false
    this._delete = null
    this._select = null
    this._update = null
    this._from = null
    this._join = null
    this._where = null
    this._order = null
    this._group = null
    this._having = null
    this._limit = null
    this._fetch = null
    this._offset = null
    this._tableName = null
  }

  get statement() {
    const statement = {
      from: this._from || this._tableName,
      join: this._join,
      where: this._where,
      order: this._order,
      group: this._group,
      having: this._having,
      limit: this._limit,
      fetch: this._fetch,
      offset: this._offset,
    }

    return Object.fromEntries(
      Object
        .entries(statement)
        .filter(([, v]) => v != null)
    )
  }

  get adapter() {
    // eventually we will have options here.
    // dry this up with base operations base class
    return new PostgresAdapter()
  }

  get dreamClass() {
    // turn this into callback, shouldmnt have this reference here.
    return this._dreamClass
  }

  get mode() {
    if (this._select) return 'select'
    if (this._update) return 'update'
    if (this._delete) return 'delete'
    throw `Invalid mode for query.`
  }

  async do() {
    let results

    switch (this.mode) {
    case 'delete':
      return await this.adapter.delete(this._delete, this.statement)

    case 'select':
      results = await this.adapter.select(this._select, {
        ...this.statement,
      })
      if (this.dreamClass) return results.map(result => new this.dreamClass(result))
      return results

    case 'update':
      return await this.adapter.update(this._tableName, this._update, this.statement)

    default:
      throw `Invalid mode for query.`
    }
  }

  async all() {
    return await this.do()
  }

  count() {
    this._count = true
    return this
  }

  delete(tableName) {
    this._delete = tableName
    return this
  }

  async first() {
    const results = await this.limit(1).do()
    if (results[0])
      return results[0]

    return null
  }

  fetch(_fetch) {
    if (!_fetch) throw new InvalidFetchClause(_fetch)
    this._fetch = _fetch
    return this
  }

  from(from) {
    if (!from) throw new InvalidFromClause(from)
    this._from = from
    return this
  }

  fullOuterJoin(tableName, on) {
    if (typeof on === 'object') return this.join(tableName, { ...on, type: 'full outer' })
    return this.join(tableName, on, { type: 'full outer' })
  }

  group(group) {
    if (!group) throw new InvalidGroupClause(group)
    this._group = group
    return this
  }

  having(having) {
    if (!having) throw new InvalidHavingClause(having)
    this._having = having
    return this
  }

  // on can also be passed into opts
  join(tableName, on, opts=null) {
    if (!tableName) throw `missing required arg: tableName`
    if (typeof on === 'object' && !opts) {
      opts = on
      on = opts.on
    }

    if (!this._join) this._join = []
    this._join.push({
      table: tableName,
      on,
      type: opts?.type || 'inner',
    })
    return this
  }

  leftOuterJoin(tableName, on) {
    if (typeof on === 'object') return this.join(tableName, { ...on, type: 'left outer' })
    return this.join(tableName, on, { type: 'left outer' })
  }

  order(order) {
    if (!order) throw new InvalidOrderClause(order)
    this._order = order
    return this
  }

  limit(limit) {
    if (!limit) throw new InvalidLimitClause(limit)
    this._limit = limit
    return this
  }

  offset(offset) {
    if (!offset) throw new InvalidOffsetClause(offset)
    this._offset = offset
    return this
  }

  rightOuterJoin(tableName, on) {
    if (typeof on === 'object') return this.join(tableName, { ...on, type: 'right outer' })
    return this.join(tableName, on, { type: 'right outer' })
  }

  select(...fields) {
    if (!this._select)
      this._select = fields
    else
      this._select = [
        ...this._select,
        ...fields,
      ]
    return this
  }

  update(tableName, fields) {
    if (typeof fields !== 'object') throw `Invalid type ${typeof fields} for fields`
    this._tableName = tableName
    this._update = fields
    return this
  }

  valueFor(field) {
    if (this[`_${field}`] === undefined) throw `invalid field ${field}. Pass a valid Query param, like select, where, etc...`
    return this[`_${field}`]
  }

  where(where) {
    if (!where) throw new InvalidWhereClause(where)
    this._where = {
      ...(this._where || {}),
      ...where,
    }
    return this
  }
}
