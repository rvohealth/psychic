import bluebird from 'bluebird'
import { Pool } from 'pg'
import MissingTableName from 'src/error/db/adapter/missing-table-name'
import config from 'src/config'
import SQLWriter from 'src/db/adapter/postgres/sql-writer'

class PostgresAdapter {
  pool() {
    if (this._pool) return this._pool

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
    const sql = SQLWriter.addColumn(tableName, columnName, dataType, constraints)

    const results = await this.transaction(async () => {
      const results = await this.runSQL(sql)

      if (constraints?.index) {
        const indexSql = SQLWriter.index(tableName, columnName, constraints)
        await this.runSQL(indexSql)
      }

      return results
    })

    return results
  }

  async changeDefault(tableName, columnName, defaultValue) {
    const sql = SQLWriter.changeDefault(tableName, columnName, defaultValue)
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
    const sql = SQLWriter.columnInfo(tableName, columnName)
    const result = await this.runSQL(sql)
    return result.rows[0]
  }

  async count(tableName) {
    const sql = SQLWriter.count(tableName)
    const response = await this.runSQL(sql)
    return parseInt(response.rows[0].count || 0)
  }

  async createDB(dbName=config.dbName) {
    const sql = SQLWriter.createDB(dbName)
    return await this.runRootSQL(sql)
  }

  async createMigrationsIfNotExists() {
    if (await this.tableExists('migrations')) return

    const response = await this.createTable('migrations', [
      { name: config.dbIdField, type: 'int', primary: true },
      { name: 'name', type: 'string' },
      { name: 'created_at', type: 'timestamp' },
    ])
    return response
  }

  async createTable(tableName, columns) {
    if (typeof tableName !== 'string') throw new MissingTableName()
    if (!tableName.length) throw new MissingTableName()

    const sql = SQLWriter.createTable(tableName, columns)

    const result = await this.transaction(async () => {
      const result = await this.runSQL(sql)

      for (const column of columns) {
        if (!column.index) continue
        const indexSql = SQLWriter.index(tableName, column.name, { ...column, column: column.name })
        await this.runSQL(indexSql)
      }

      return result
    })

    return result
  }

  async delete(tableName, options={}) {
    const sql = SQLWriter.delete(tableName, options)
    const result = await this.runSQL(sql)
    return result.rows
  }

  async dropAllTables() {
    const sql = SQLWriter.dropAllTables()
    return await this.runSQL(sql)
  }

  async dropColumn(tableName, columnName) {
    const sql = SQLWriter.dropColumn(tableName, columnName)
    return await this.runSQL(sql)
  }

  async dropDB(dbName=config.dbName) {
    const sql = SQLWriter.dropDB(dbName)
    let response
    try {
      response = await this.runRootSQL(sql)
    } catch(error) {
      // leave alone
    }
    return response
  }

  async dropTable(tableName) {
    const sql = SQLWriter.dropTable(tableName)
    return await this.runSQL(sql)
  }

  async hasColumn(tableName, columnName) {
    const sql = SQLWriter.hasColumn(tableName, columnName)

    try {
      const results = await this.runSQL(sql)
      return !!results.rows.length
    } catch(error) {
      return false
    }
  }

  async indexes(tableName) {
    const sql = SQLWriter.indexes(tableName)
    const result = await this.runSQL(sql)
    return result.rows
  }

  async insert(tableName, rows) {
    if (!Array.isArray(rows)) rows = [rows]

    const sql = SQLWriter.insert(tableName, rows)
    const result = await this.runSQL(sql)

    if (result.rows.length === 1) return result.rows[0]
    return result.rows
  }

  async renameColumn(tableName, columnName, newColumnName) {
    const sql = SQLWriter.renameColumn(tableName, columnName, newColumnName)
    return await this.runSQL(sql)
  }

  async renameTable(tableName, newTableName) {
    const sql = SQLWriter.renameTable(tableName, newTableName)
    return await this.runSQL(sql)
  }

  async select(fields, options) {
    const sql = SQLWriter.select(fields, options)
    const results = await this.runSQL(sql)

    if (fields[0] === 'count(*)' && fields.length === 1)
      return parseInt(results.rows[0].count)

    return results.rows
  }

  async tableExists(tableName) {
    const sql = SQLWriter.tableExists(tableName)
    const result = await this.runSQL(sql)
    return !!result.rows[0].to_regclass
  }

  async transaction(cb) {
    let result
    try {
      await this.runSQL('BEGIN')
      result = await cb()
      await this.runSQL('COMMIT')
    } catch (error) {
      await this.runSQL('ROLLBACK')
    }

    return result
  }

  async truncateAll() {
    const sql = SQLWriter.truncateAll()
    return await this.runSQL(sql)
  }

  async update(tableName, attributes, options={}) {
    const sql = SQLWriter.update(tableName, attributes, options)
    const result = await this.runSQL(sql)
    return result.rows
  }
}

export default PostgresAdapter
