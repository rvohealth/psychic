import fs from 'fs'
import config from 'src/config'
import File from 'src/helpers/file'

export default class SchemaWriter {
  static get schemaExists() {
    return fs.existsSync(config.schemaPath)
  }

  static async destroy() {
    if (this.schemaExists)
      await File.unlink(config.schemaPath)
  }

  constructor() {
    this.schema = {}
  }

  createTable(tableName, columns) {
    const schema = {}
    columns.forEach(column => {
      schema[column.name] = this._row(column)
    })

    this.updateSchema(tableName, schema)
  }

  updateSchema(tableName, updatesToSchema) {
    const currentSchema = this.readSchema() || {}
    const updatedSchema = {
      ...currentSchema,
      [tableName]: {
        ...(currentSchema[tableName] || {}),
        ...updatesToSchema,
      }
    }
    fs.writeFileSync(
      config.schemaPath,
      JSON.stringify(updatedSchema, null, 2)
    )
  }

  readSchema() {
    try {
      return JSON.parse(fs.readFileSync(config.schemaPath))
    } catch {
      return {}
    }
  }

  _row(column) {
    return {
      ...column,
    }
  }
}
