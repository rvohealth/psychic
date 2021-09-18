import CLIProgram from 'src/cli/program'
import GenerateDream from 'src/cli/program/generate/dream'
import GenerateJSAPI from 'src/cli/program/generate/js/api'
import GenerateMigration from 'src/cli/program/generate/migration'

export default class GenerateCLIProgram extends CLIProgram {
  async run(args) {
    switch(args.command) {
    case 'dream':
      return await new GenerateDream().generate(args.args)

    case 'js':
      return await new GenerateJSAPI().generate(args.args)

    case 'migration':
      return await new GenerateMigration().generate(args.args)

    default:
      throw `unhandled program ${args.command} for generate command`
    }
  }
}
