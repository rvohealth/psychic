import CLIProgram from 'src/cli/program'
import spawn from 'src/helpers/spawn'

export default class SpecCLIProgram extends CLIProgram {
  async run(args) {
    if (args.command === null) return await this.spec(args.args)
    throw `unhandled command ${args.command}`
  }

  async spec(args) {
    const command = args ?
      `yarn test ${args.join(' ')}` :
      'yarn test'
    await spawn(command, [], { shell: true, stdio: 'inherit' })
  }
}
