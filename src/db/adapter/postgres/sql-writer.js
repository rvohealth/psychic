// this is originally written for postgres, but intended to be adapted
// by other writers and overridden to support other sql variants.

import formatSQL from 'pg-format'
import Constraints from 'src/db/adapter/postgres/sql-writer/constraints'
import Clauses from 'src/db/adapter/postgres/sql-writer/clauses'
import DataTypes from 'src/db/data-types'
import config from 'src/config'

export default class SQLWriter {
  static addColumn(tableName, columnName, dataType, constraints) {
    let sql =
`
ALTER TABLE ${tableName}
ADD COLUMN ${columnStatement(columnName, dataType, constraints)}\
`
    return sql
  }

  static changeDefault(tableName, columnName, defaultValue) {
    const sql =
`
ALTER TABLE ${tableName}
ALTER COLUMN ${columnName}
SET DEFAULT '${defaultValue}'
`
    return sql
  }

  static columnInfo(tableName, columnName) {
    const sql =
`
SELECT *
FROM information_schema.columns
WHERE table_name='${tableName}' AND column_name='${columnName}'
`
    return sql
  }

  static count(tableName) {
    return `SELECT COUNT(*) FROM ${tableName}`
  }

  static createDB(dbName) {
    return formatSQL(`CREATE DATABASE ${dbName}`)
  }

  static createTable(tableName, columns) {
    const sql =
`
CREATE TABLE ${tableName} (
  ${createTableColumns(columns)}
)
`
    return sql
  }

  static delete(tableName, { where }={}) {
    let sql = `DELETE FROM ${tableName}`
    return sql + Clauses.whereClause(where)
  }

  static dropAllTables() {
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
    return sql
  }

  static dropColumn(tableName, columnName) {
    const sql =
`
ALTER TABLE ${tableName}
DROP COLUMN ${columnName}
`
    return sql
  }

  static dropDB(dbName) {
    return formatSQL(`DROP DATABASE ${dbName}`)
  }

  static dropTable(tableName) {
    return formatSQL(`DROP TABLE ${tableName}`)
  }

  static hasColumn(tableName, columnName) {
    const sql =
`
SELECT column_name
FROM information_schema.columns
WHERE table_name='${tableName}' and column_name='${columnName}'
`
    return sql
  }

  static index(tableName, columnName, constraints) {
    const columnNames = do {
      switch(constraints.index.constructor.name) {
      case 'Boolean':
        [columnName]
        break

      case 'Array':
        [ columnName, ...constraints.index ]
        break

      case 'Object':
        [ columnName, ...(constraints.index.columns || constraints.index.column || []) ]
        break
      }
    }

    const indexName = do {
      switch(constraints.index.constructor.name) {
      case 'String':
        constraints.index
        break

      case 'Object':
        constraints.index.name
        break

      default:
        null
      }
    } || `index_${tableName}_on_${columnNames.join('_and_')}`

    const unique = do {
      switch(constraints.index.constructor.name) {
      case 'Object':
        constraints.index.unique || constraints.index.uniq
        break

      default:
        false
      }
    }

    const indexSql =
`\
CREATE ${unique ? 'UNIQUE ' : ''}INDEX ${indexName} ON ${tableName} (${columnNames.join(', ')})\
`
    return indexSql
  }

  static indexes(tableName) {
    const sql =
`
SELECT *
FROM pg_indexes
WHERE tablename = '${tableName}'
`
    return sql
  }

  static insert(tableName, rows) {
    if (!Array.isArray(rows)) rows = [rows]

    const sql = formatSQL(
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

    return sql
  }

  static renameColumn(tableName, columnName, newColumnName) {
    const sql =
`
ALTER TABLE ${tableName}
RENAME COLUMN ${columnName} TO ${newColumnName}
`
    return sql
  }

  static renameTable(tableName, newTableName) {
    const sql =
`
ALTER TABLE ${tableName}
RENAME TO ${newTableName}
`
    return sql
  }

  static select(fields, options) {
    const sql = Clauses.selectClause(`SELECT ${fields.join(', ')}`, options)
    return sql
  }

  static tableExists(tableName) {
    const sql =
`
SELECT to_regclass('${tableName}')
`
    return sql
  }

  static truncateAll() {
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
    return sql
  }

  static update(tableName, attributes, options={}) {
    let sql =
`
UPDATE ${tableName}
SET ${Object.keys(attributes).map(attribute => `${attribute}='${attributes[attribute]}'`)}
`
    return Clauses.updateClause(sql, options)
  }
}

function columnStatement(columnName, datatype, constraints) {
  return `${columnName} ${DataTypes.typeString(datatype, constraints)}${new Constraints(constraints).build()}`
}

function createTableColumns(columns) {
  return columns
    .map(column => {
      // make sure id field increments in create table statements
      if (column.name === config.dbIdField)
        column.increment = true

      return columnStatement(column.name, column.type, column)
    })
    .join(',\n  ')
}
