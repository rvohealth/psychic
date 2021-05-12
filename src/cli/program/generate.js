import CLIProgram from 'src/cli/program'
import GenerateJSAPI from 'src/cli/program/generate/js/api'

export default class GenerateCLIProgram extends CLIProgram {
  async run(args) {
    if (args.command === 'js')
      return await this.js(args)

    throw `unhandled program ${args.command} for generate command`
  }

  async js(args) {
    new GenerateJSAPI().generate()
  }
}
