import CLIProgram from 'src/cli/program'
import spawn from 'src/helpers/spawn'
export default class IntegrationSpecCLIProgram extends CLIProgram {
  async run(args) {
    if (args.command === null) return await this.intspec(args.args)
    throw `unhandled command ${args.command}`
  }

  async intspec(args) {
    if (args?.length)
      await spawn(`yarn run integration-spec-untargeted ${args.join(' ')} --forceExit`, [], { shell: true, stdio: 'inherit' })
    else
      await spawn(`yarn run integration-spec --forceExit`, [], { shell: true, stdio: 'inherit' })
  }
}
