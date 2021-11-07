import CLIProgram from 'src/cli/program'
import spawn from 'src/helpers/spawn'

export default class TranceCLIProgram extends CLIProgram {
  async run(args) {
    if (args.command === null) return await this.gaze()
    throw `unhandled command ${args.command}`
  }

  async gaze() {
    spawn(`yarn run trance`, [], { shell: true, stdio: 'inherit' })
  }
}
