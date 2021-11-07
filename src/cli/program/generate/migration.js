import l from 'src/singletons/l'
import File from 'src/helpers/file'
import moment from 'moment'


export default class GenerateMigration {
  async generate(args) {
    const [ filename, ...columns ] = args
    const filepath = `db/migrate/${generateFilename(filename, columns)}.js`

    await File.write(filepath, generateMigrationTemplate(filename, columns))

    if (!process.env.CORE_TEST) {
      l.log(`wrote migration to: ${filepath}`)
      return process.exit()
    }
  }
}

function generateMigrationTemplate(filename, columns) {
  if (columns.empty) return emptyMigrationTemplate()

  return (
`
export async function up(m) {
  m.createTable('${filename.hyphenize().pluralize()}', t => {
${ columns.map(column => columnString(column)).join("\n") }
  })
}

export async function down(m) {
  m.dropTable('${filename.hyphenize().pluralize()}')
}
` )
}

function emptyMigrationTemplate() {
  return (
`
export async function up(m) {
}

export async function down(m) {
}
` )
}

function columnString(column) {
  const [ columnType, columnName ] = column.split(':')
  if (!columnType || !columnName)
    throw `invalid column format ${column}. statement must match type:name, i.e. string:email`

  switch(columnType) {
  case 'array':
  case 'char':
  case 'date':
  case 'float':
  case 'hstore':
  case 'json':
  case 'string':
  case 'text':
  case 'time':
  case 'timestamp':
  case 'uuid':
  case 'varchar':
    return `    t.${columnType}('${columnName}')`

  case 'belongsTo':
  case 'belongsto':
  case 'belongs_to':
    return `    t.belongsTo('${columnName}')`

  case 'bool':
  case 'boolean':
    return `    t.bool('${columnName}')`

  case 'int':
  case 'integer':
    return `    t.int('${columnName}')`

  default:
    throw `unhandled type ${columnType}`
  }
}

function generateFilename(filename, columns) {
  const timestamp = moment().format(`YYYYMMDDHHmmss`)
  if (columns.empty) return `${timestamp}-${filename.hyphenize()}`
  return `${timestamp}-create-${filename.hyphenize().pluralize()}`
}
