import fs from 'fs'

const MigrateConfigProvider = superclass => class extends superclass {
  get currentMigrationPath() {
    return 'tmp/migrate/current.json'
  }

  get schemaPath() {
    if (process.env.CORE_TEST) return 'tmp/spec/schema.json'

    if (!fs.existsSync('app'))
      return `template/psychic-app/config/schema.json`

    return `config/schema.json`
  }

  get schema() {
    if (process.env.CORE_TEST) return {} // stub in individual specs
    return JSON.parse(fs.readFileSync(this.schemaPath))
  }
}

export default MigrateConfigProvider
