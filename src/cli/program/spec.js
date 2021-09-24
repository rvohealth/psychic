import CLIProgram from 'src/cli/program'
import spawn from 'src/helpers/spawn'
import Dir from 'src/helpers/dir'

export default class SpecCLIProgram extends CLIProgram {
  async run(args) {
    if (args.command === null) return await this.spec(args.args)
    throw `unhandled command ${args.command}`
  }

  async spec(args) {
    if (args?.length)
      await spawn(`yarn test ${args.join(' ')} --forceExit`, [], { shell: true, stdio: 'inherit' })

    else {
      for (const folder of await Dir.readdir('spec')) {
        if (await Dir.isDir(`spec/${folder}`))
          await spawn(`yarn test ./spec/${folder} --forceExit`, [], { shell: true, stdio: 'inherit' })
      }
    }
  }
}
