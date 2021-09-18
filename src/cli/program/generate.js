import CLIProgram from 'src/cli/program'
import GenerateJSAPI from 'src/cli/program/generate/js/api'
import GenerateMigration from 'src/cli/program/generate/migration'

export default class GenerateCLIProgram extends CLIProgram {
  async run(args) {
    switch(args.command) {
    case 'js':
      return await this.js(args.args)

    case 'migration':
      return await this.migration(args.args)

    default:
      throw `unhandled program ${args.command} for generate command`
    }
  }

  async js(args) {
    await new GenerateJSAPI().generate(args)
  }

  async migration(args) {
    await new GenerateMigration().generate(args)
  }
}
