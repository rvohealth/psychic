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
    const filepath = `app/dreams/${dreamname}.js`

    await File.write(filepath, dreamTemplate(dreamname))

    if (!process.env.CORE_TEST)
      l.log(`wrote migration to: ${filepath}`)
  }

  async _generateMigration(args) {
    const timestamp = moment().format(`YYYYMMDDHHmmss`)
    const [ dreamname ] = args
    const filepath = `db/migrate/${timestamp}-create-${dreamname}.js`

    await File.write(filepath, migrationTemplate(dreamname))

    if (!process.env.CORE_TEST)
      l.log(`wrote migration to: ${filepath}`)
  }
}

function migrationTemplate(name) {
  return (
`
export async function up(m) {
  await m.createTable('${name}', t => {
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
`
import psychic, { Dream } from 'psychic'

export default class ${name.capitalize()} extends Dream {
}
`
  )
}

