const fileScope = this

import CLIProgram from 'src/cli/program'
// import spawn from 'src/helpers/spawn'
// import Dir from 'src/helpers/dir'
import File from 'src/helpers/file'

export default class RunCLIProgram extends CLIProgram {
  async run(args) {
    if (args.command === null) return await this.runFile(args.args)
    throw `unhandled command ${args.command}`
  }

  async runFile(args) {
    const [ filepath ] = args
    const str = await File.text(filepath)
    const func = await eval(str)
    await func.call(fileScope)

    if (!process.env.CORE_TEST)
      process.exit()
  }
}

