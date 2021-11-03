import bluebird from 'bluebird'
import { Pool } from 'pg'
import formatSQL from 'pg-format'
import MissingTableName from 'src/error/db/adapter/missing-table-name'
import config from 'src/config'

class PostgresAdapter {
  pool() {
    if (this._pool) return this._pool

    console.trace()
    this._pool = new Pool({
      Promise: bluebird,

      idleTimeoutMillis: 10,
      connectionTimeoutMillis: 100,
      allowExitOnIdle: true,

      database: config.dbName,
      user: config.dbUsername,
      password: config.dbPassword,
      host: config.dbHost || 'localhost',
      port: parseInt(config.dbPort) || 5432,
      max: 300,
    })

    return this._pool
  }

  rootPool() {
    if (this._rootPool) return this._rootPool

    this._rootPool = new Pool({

      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,

      Promise: bluebird,
      user: config.dbUsername,
      password: config.dbPassword,
      database: 'postgres',
      host: config.dbHost || 'localhost',
      port: parseInt(config.dbPort) || 5432,
      max: 300,
    })

    return this._rootPool
  }

  async flush() {
    await this.pool().end()
    await this.rootPool().end()
  }

  // async client() {
  //   return await this.pool().connect()
  // }

  // async rootClient() {
  //   return await this.rootPool().connect()
  // }

  // async withRootConnection(cb) {
  //   const client = await this.rootClient()
  //   const result = await cb(client)
  //   // await client.release()
  //   return result
  // }

  // async withConnection(cb) {
  //   const client = await this.client()
  //   const result = await cb(client)
  //   // await client.release()
  //   return result
  // }

  async runRootSQL(sqlString) {
    // return await this.withRootConnection(async client => {
      let response
      const client = await this.rootPool().connect()

      try {
        response = await client.query(sqlString)
      } finally {
        await client.release()
      }

      return response
    // })
  }

  async runSQL(sqlString) {
    // const r = await this.withConnection(async client => {
      let response
      const stack = new Error().stack
      const client = await this.pool().connect()

      try {
        response = await client.query(sqlString)
      } catch(error) {
        if (!ENV.CORE_TEST) console.error(stack)
        throw error
      } finally {
        await client.release()
      }

      return response
    // })
    // return r
  }

  async addColumn(tableName, columnName, dataType, constraints) {
    const sql =
`
ALTER TABLE ${tableName}
ADD COLUMN ${columnName} ${dataType} ${this._constraints(constraints)}
`
    return await this.runSQL(sql)
  }

  async changeDefault(tableName, columnName, defaultValue) {
    const sql =
`
ALTER TABLE ${tableName}
ALTER COLUMN ${columnName}
SET DEFAULT '${defaultValue}'
`
    return await this.runSQL(sql)
  }

  async closeConnection() {
    // const client = await this.client()
    // await client.end()

    // const rootClient = await this.rootClient()
    // return await rootClient.end()
  }

  async columnDefault(tableName, columnName) {
    const info = await this.columnInfo(tableName, columnName)
    return info.column_default
  }

  async columnInfo(tableName, columnName) {
    const sql =
`
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name='${tableName}' AND column_name='${columnName}'
`
    const result = await this.runSQL(sql)
    return result.rows[0]
  }

  async count(tableName) {
    const sql = `SELECT COUNT(*) FROM ${tableName}`
    const response = await this.runSQL(sql)
    return parseInt(response.rows[0].count || 0)
  }

  async createDB(dbName) {
    const sql = this.formatSQL("CREATE DATABASE " + dbName || config.dbName)
    return await this.runRootSQL(sql)
  }

  async createMigrationsIfNotExists() {
    if (await this.tableExists('migrations')) return

    const response = await this.createTable('migrations', [
      { name: 'id', type: 'int', primary: true },
      { name: 'name', type: 'string' },
      { name: 'created_at', type: 'timestamp' },
    ])
    return response
  }

  async createTable(tableName, columns) {
    if (typeof tableName !== 'string') throw new MissingTableName()
    if (!tableName.length) throw new MissingTableName()

    const sql =
`
CREATE TABLE ${tableName} (
  ${
    columns.map(column => {
      switch(column.type) {
      case 'array':
        return `${column.name} ${column.datatype.toUpperCase()} []` + this._constraints(column)

      case 'char':
        return `${column.name} CHAR(${typeof column.length === 'number' ? column.length : 1})`

      case 'date':
        return `${column.name} DATE`

      case 'boolean':
        return `${column.name} BOOLEAN` + this._constraints(column)

      case 'float':
        return `${column.name} FLOAT` + this._constraints(column)

      case 'hstore':
        return `${column.name} HSTORE` + this._constraints(column)

      case 'int':
        return `${column.name} serial` + this._constraints(column)

      case 'json':
        return `${column.name} JSON` + this._constraints(column)

      case 'string':
      case 'text':
        return `${column.name} TEXT` + this._constraints(column)

      case 'time':
        return `${column.name} TIME` + this._constraints(column)

      case 'timestamp':
        return `${column.name} TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP`

      case 'uuid':
        return `${column.name} uuid` + this._constraints(column)

      case 'varchar':
        return `${column.name} VARCHAR(${typeof column.length === 'number' ? column.length : 255})`

      default:
        throw 'UNHANDLED TYPE ' + column.type
      }
    })
    .join(',\n  ')
  }
)
`
    return await this.runSQL(sql)
  }

  async delete(tableName, options={}) {
    let sql = `DELETE FROM ${tableName}`
    sql = this._applyDeleteClauses(sql, options)
    const result = await this.runSQL(sql)
    return result.rows
  }

  async dropAllTables() {
    const sql =
`
DO $$ DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = current_schema()) LOOP
        EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE';
    END LOOP;
END $$;
`
    return await this.runSQL(sql)
  }

  async dropColumn(tableName, columnName) {
    const sql =
`
ALTER TABLE ${tableName}
DROP COLUMN ${columnName}
`
    return await this.runSQL(sql)
  }

  async dropDB(dbName) {
    const sql = this.formatSQL("DROP DATABASE " + dbName || config.dbName)
    let response
    try {
      response = await this.runRootSQL(sql)
    } catch(error) {
      // leave alone
    }
    return response
  }

  async dropTable(tableName) {
    return await this.runSQL('DROP TABLE ' + tableName)
  }

  async hasColumn(tableName, columnName) {
    const sql =
`
SELECT column_name
FROM information_schema.columns
WHERE table_name='${tableName}' and column_name='${columnName}'
`
    try {
      const results = await this.runSQL(sql)
      return !!results.rows.length
    } catch(error) {
      return false
    }
  }

  async insert(tableName, rows) {
    if (!Array.isArray(rows)) rows = [rows]

    const sql = this.formatSQL(
`
INSERT INTO ${tableName}
  (${Object.keys(rows[0]).join(', ')})
  VALUES %L
  RETURNING *
`,
      rows.map(row =>
        Object
          .keys(row)
          .map(key => {
            const columnType = config.columnType(tableName, key)
            const v = row[key]

            if (v?.constructor?.name === 'Moment') return v.toISOString()
            if (Array.isArray(v)) return `{${v.join(', ')}}`
            if (columnType === 'hstore') return Object
              .keys(v)
              .map(hstoreKey => {
                return `"${hstoreKey}" => "${v[hstoreKey]}"`
              })
              .join(',\n')
            // if (config.columnType())
            return v
          })
      )
    )

    const result = await this.runSQL(sql)
    if (result.rows.length === 1) return result.rows[0]
    return result.rows
  }

  async renameColumn(tableName, columnName, newColumnName) {
    const sql =
`
ALTER TABLE ${tableName}
RENAME COLUMN ${columnName} TO ${newColumnName}
`
    return await this.runSQL(sql)
  }

  async renameTable(tableName, newTableName) {
    const sql =
`
ALTER TABLE ${tableName}
RENAME TO ${newTableName}
`
    return await this.runSQL(sql)
  }

  async select(fields, options) {
    const sql = this._applySelectClauses(`SELECT ${fields.join(', ')}`, options)
    const results = await this.runSQL(sql)

    if (fields[0] === 'count(*)' && fields.length === 1)
      return parseInt(results.rows[0].count)

    return results.rows
  }

  async tableExists(tableName) {
    const sql =
`
SELECT to_regclass('${tableName}')
`
    const result = await this.runSQL(sql)
    return !!result.rows[0].to_regclass
  }

  async transaction(cb) {
    try {
      await this.runSQL('BEGIN')
      await cb()
      await this.runSQL('COMMIT')
    } catch (error) {
      await this.runSQL('ROLLBACK')
    }
  }

  async truncateAll() {
    const sql =
`
DO
$func$
BEGIN
   EXECUTE
   (SELECT 'TRUNCATE TABLE ' || string_agg(oid::regclass::text, ', ') || ' CASCADE'
    FROM   pg_class
    WHERE  relkind = 'r'  -- only tables
    AND    relnamespace = 'public'::regnamespace
   );
END
$func$;
`
    return await this.runSQL(sql)
  }

  async update(tableName, attributes, options={}) {
    let sql =
`
UPDATE ${tableName}
SET ${Object.keys(attributes).map(attribute => `${attribute}='${attributes[attribute]}'`)}
`
    sql = this._applyUpdatedClauses(sql, options)
    const result = await this.runSQL(sql)
    return result.rows
  }

  _applyUpdatedClauses(statement, { group, having, limit, offset, order, returning, where }) {
    return statement +
      this._where(where) +
      this._group(group) +
      this._having(having) +
      this._order(order) +
      this._limit(limit) +
      this._offset(offset) +
      this._returning(returning)
  }

  _applyDeleteClauses(statement, { where }) {
    return statement +
      this._where(where)
  }

  _applySelectClauses(statement, { fetch, from, group, join, limit, offset, order, having, where }) {
    return statement +
      // this._joinSelects(join) + // leaving this in in case we need it later
      this._from(from) +
      // this._joinFroms(join) + // leaving this in in case we need it later
      this._joins(join) +
      this._where(where) +
      this._group(group) +
      this._having(having) +
      this._order(order) +
      this._limit(limit) +
      this._offset(offset) +
      this._fetch(fetch)
  }

  _constraints(column) {
    if (!column) return ''

    let str = ''
    if (column.primary) str += ' PRIMARY KEY'
    if (column.primary || column.unique) str += ' UNIQUE'
    // if (column.type === 'uuid' && !column.default) column.default = 'uuid_generate_v4()'
    if (column.default) str += ` DEFAULT ${column.default}`
    return str
  }

  _joins(joins) {
    if (!joins) return ''
    if (!Array.isArray(joins)) throw `invalid type ${typeof joins} passed for arg: joins`

    return joins.reduce((agg, join) => {
      agg += `\n${(join.type || 'inner').toUpperCase()} JOIN ${join.table}`

      // const data = this._interpretJoinOn(join.on)
      if (join.on) {
        agg += `\nON ${join.on}` // originally was this simple, not sure added complexity will benefit us...
        // agg += `\nON ${data.left.table}.${data.left.column}=` + (data.right.column ? `${data.right.table}.${data.right.column}` : `${data.right.table}`)
      }

      return agg
    }, '')
  }

  // _joinFroms(joins) {
  //   if (!joins) return ''
  //   if (!Array.isArray(joins)) throw `invalid type ${joins.constructor.name} passed for arg: joins`

  //   const froms = []
  //   joins.forEach((join) => {
  //     if (join.on) {
  //       const data = this._interpretJoinOn(join.on)
  //       if (data.left.table && data.left.column)
  //         froms.push(data.left.table)

  //       if (data.right.table && data.right.column)
  //         froms.push(data.right.table)
  //     }
  //   })

  //   if (!froms.length) return ''
  //   return ', ' + froms.uniq().join(', ')
  // }

  // _joinSelects(joins) {
  //   if (!joins) return ''
  //   if (!Array.isArray(joins)) throw `invalid type ${joins.constructor.name} passed for arg: joins`

  //   const selects = []
  //   joins.forEach(join => {
  //     if (join.on) {
  //       const data = this._interpretJoinOn(join.on)
  //       if (data.left.table && data.left.column)
  //         selects.push(`${data.left.table}.${data.left.column} AS "${data.left.table}_${data.left.column}"`)

  //       if (data.right.table && data.right.column)
  //         selects.push(`${data.right.table}.${data.right.column} AS "${data.right.table}_${data.right.column}"`)
  //     }
  //   })

  //   if (!selects.length) return ''
  //   return ', ' + selects.uniq().join(', ')
  // }

  _interpretJoinOn(joinOn) {
    const tableAndFields = joinOn.split(/\s{0,}=\s{0,}/)
    const left = tableAndFields[0]
    const right = tableAndFields[1]

    const leftParts = left.split('.')
    const leftTableName = leftParts[0]
    const leftColumn = leftParts[1]

    const rightParts = right.split('.')
    const rightTableName = rightParts[0]
    const rightColumn = rightParts[1]

    return {
      left: {
        table: leftTableName,
        column: leftColumn,
      },
      right: {
        table: rightTableName,
        column: rightColumn,
      }
    }
  }

  formatSQL(sql, ...fields) {
    return formatSQL(sql, ...fields)
  }

  _fetch(_fetch) {
    if (!_fetch) return ''
    return `\nFETCH FIRST ${_fetch} ${_fetch > 1 ? 'ROWS' : 'ROW'} ONLY`
  }

  _from(from) {
    if (!from) return ''
    return `\nFROM ${from}`
  }

  _group(group) {
    if (!group) return ''
    return `\nGROUP BY ${group.join(', ')}`
  }

  _having(having) {
    if (!having) return ''
    return `\nHAVING ${having}`
  }

  _limit(limit) {
    if (!limit) return ''
    return `\nLIMIT ${limit}`
  }

  _offset(offset) {
    if (!offset) return ''
    return `\nOFFSET ${offset}`
  }

  _order(order) {
    if (!order || !(Array.isArray(order) && order.length)) return ''
    return `\nORDER BY ${
      order
        .map(o => {
          if (typeof o === 'string') return o
          if (Array.isArray(o) && o.length === 1) return `${o[0]}`
          if (Array.isArray(o) && o.length === 2) return `${o[0]} ${o[1]}`
          if (typeof o === 'object') return `${o.col || o.column} ${o.dir || o.direction || 'asc'}`
        })
        .join(', ')
    }`
  }

  _returning(returning) {
    if (!returning) return 'RETURNING *'
    return `\nRETURNING ${returning.join(', ')}`
  }

  _where(where) {
    if (!where || !Object.keys(where).length) return ''
    return `\nWHERE ${Object.keys(where).map(attribute => `${attribute}='${where[attribute]}`).join('AND ')}'`
  }
}

export default PostgresAdapter
