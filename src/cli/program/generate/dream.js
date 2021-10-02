import l from 'src/singletons/l'
import File from 'src/helpers/file'
import moment from 'moment'

export default class GenerateDream {
  async generate(args) {
    await this._generateDream(args)
    await this._generateMigration(args)

    if (!process.env.CORE_TEST)
      return process.exit()
  }

  async _generateDream(args) {
    const [ dreamname ] = args
    const filepath = `app/dreams/${dreamname.hyphenize()}.js`

    await File.write(filepath, dreamTemplate(dreamname))

    if (!process.env.CORE_TEST)
      l.log(`wrote migration to: ${filepath}`)
  }

  async _generateMigration(args) {
    const timestamp = moment().format(`YYYYMMDDHHmmss`)
    const [ dreamname ] = args
    const filepath = `db/migrate/${timestamp}-create-${dreamname.hyphenize()}.js`

    await File.write(filepath, migrationTemplate(dreamname, args.slice(1)))

    if (!process.env.CORE_TEST)
      l.log(`wrote migration to: ${filepath}`)
  }
}

function migrationTemplate(name, args=[]) {
  let fieldsString = ''
  args.forEach(arg => {
    const [ type, fieldName ] = arg.split(':')
    fieldsString += `    t.${type}('${fieldName}')\n`
  })

  return (
`\
export async function up(m) {
  await m.createTable('${name}', t => {
${fieldsString.replace(/\n$/, '')}
  })
}

export async function down(m) {
  await m.dropTable('${name}')
}
`
  )
}

function dreamTemplate(name) {
  return (
`\
import psychic, { Dream } from 'psychic'

export default class ${name.pascalize()} extends Dream {
}
`
  )
}

