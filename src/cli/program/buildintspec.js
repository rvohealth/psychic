import CLIProgram from 'src/cli/program'
import spawn from 'src/helpers/spawn'
import Dir from 'src/helpers/dir'

export default class BuildintspecCLIProgram extends CLIProgram {
  constructor() {
    super()
  }

  async run(args) {
    if (args.command === null) return await this.buildintspec()
    throw `unhandled command ${args.command}`
  }

  async buildintspec() {
    if (await Dir.exists('tmp/integrationtestapp')) return
    await spawn('npm run psy new:app tmp/integrationtestapp ', [], { shell: true, stdio: 'inherit' })
  }
}
