import l from 'src/singletons/l'
import File from 'src/helpers/file'
import moment from 'moment'

export default class GenerateDream {
  async generate(args) {
    await this._generateDream(JSON.parse(JSON.stringify(args)))
    await this._generateMigration(JSON.parse(JSON.stringify(args)))
    await this._generateSpec(JSON.parse(JSON.stringify(args)))

    if (!process.env.CORE_TEST)
      return process.exit()
  }

  async _generateDream(args) {
    const [ dreamname, ...fields ] = args
    const filepath = `app/dreams/${dreamname.hyphenize()}.js`

    await File.write(filepath, dreamTemplate(dreamname, fields))

    if (!process.env.CORE_TEST)
      l.log(`wrote new dream to: ${filepath}`)
  }

  async _generateMigration(args) {
    const timestamp = moment().format(`YYYYMMDDHHmmss`)
    const [ dreamname ] = args
    const filepath = `db/migrate/${timestamp}-create-${dreamname.hyphenize().pluralize()}.js`

    await File.write(filepath, migrationTemplate(dreamname, args.slice(1)))

    if (!process.env.CORE_TEST)
      l.log(`wrote new migration to: ${filepath}`)
  }

  async _generateSpec(args) {
    const [ dreamname ] = args
    const filepath = `spec/dreams/${dreamname.hyphenize()}.spec.js`

    await File.write(filepath, specTemplate(dreamname))

    if (!process.env.CORE_TEST)
      l.log(`wrote new spec to: ${filepath}`)
  }
}

function migrationTemplate(name, args=[]) {
  let fieldsString = ''
  args.forEach(arg => {
    const [ type, fieldName ] = arg.split(':')

    switch(type) {
    case 'belongsto':
    case 'belongsTo':
    case 'belongs_to':
      fieldsString += `    t.belongsTo('${fieldName}')\n`
      break

    case 'hasone':
    case 'hasOne':
    case 'has_one':
    case 'hasmany':
    case 'hasMany':
    case 'has_many':
      break

    default:
      fieldsString += `    t.${type}('${fieldName}')\n`
    }
  })

  const pluralizedName = name.snakeify().pluralize()

  return (
`\
export async function up(m) {
  await m.createTable('${pluralizedName}', t => {
${fieldsString.replace(/\n$/, '')}
    t.timestamps()
  })
}

export async function down(m) {
  await m.dropTable('${pluralizedName}')
}
`
  )
}

function dreamTemplate(name, args=[]) {
  if (args.empty) return blankDreamTemplate(name)

  return (
`\
import { Dream } from 'psychic'

export default class ${name.pascalize()} extends Dream {
  static do {
    this
${ args.map(arg => dreamStaticBlock(name, arg)).join("\n") }
  }
}
`
  )
}

function blankDreamTemplate(name) {
  return (
`\
import { Dream } from 'psychic'

export default class ${name.pascalize()} extends Dream {
}
`
  )
}

function specTemplate(name) {
  return (
`\
import ${name.pascalize()} from 'app/dreams/${name.hyphenize()}'

describe ('${name.pascalize()}', () => {
})
`
  )
}

function dreamStaticBlock(dreamname, arg) {
  const [associationType, associationName] = arg.split(':')
  if (!associationType || !associationName) throw `invalid association ${arg}`

  switch(associationType) {
  case 'belongsto':
  case 'belongsTo':
  case 'belongs_to':
    return `      .belongsTo('${associationName.hyphenize()}')`

  case 'hasone':
  case 'hasOne':
  case 'has_one':
    return `      .hasOne('${associationName.hyphenize()}')`

  case 'hasmany':
  case 'hasMany':
  case 'has_many':
    return `      .hasMany('${associationName.hyphenize()}')`

  default:
    throw 'HAMBURGERZZZ'
  }
}
