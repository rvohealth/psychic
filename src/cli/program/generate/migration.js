import l from 'src/singletons/l'
import File from 'src/helpers/file'
import moment from 'moment'

const template =
`
export async function up(m) {
}

export async function down(m) {
}
`

export default class GenerateMigration {
  async generate(args) {
    const timestamp = moment().format(`YYYYMMDDHHmmss`)
    const [ filename ] = args
    const filepath = `db/migrate/${timestamp}-${filename.hyphenize()}.js`

    await File.write(filepath, template)

    if (!process.env.CORE_TEST) {
      l.log(`wrote migration to: ${filepath}`)
      return process.exit()
    }
  }
}

