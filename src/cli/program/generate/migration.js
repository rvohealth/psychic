import l from 'src/singletons/l'
import File from 'src/helpers/file'
import moment from 'moment'

export default class GenerateMigration {
  async generate(args) {
    const template = await File.read('src/cli/program/generate/template/migration/blank.template.js')
    const timestamp = moment().format(`YYYYMMDDHHmmss`)
    const [ filename ] = args
    const filepath = `db/migrate/${timestamp}-${filename}.js`

    await File.write(filepath, template.toString())

    if (!process.env.CORE_TEST) {
      l.log(`wrote migration to: ${filepath}`)
      return process.exit()
    }
  }
}

