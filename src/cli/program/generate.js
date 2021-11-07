import CLIProgram from 'src/cli/program'
import GenerateAuth from 'src/cli/program/generate/auth'
import GenerateChannel from 'src/cli/program/generate/channel'
import GenerateDream from 'src/cli/program/generate/dream'
import GenerateJSAPI from 'src/cli/program/generate/js/api'
import GenerateMigration from 'src/cli/program/generate/migration'
import GenerateProjection from 'src/cli/program/generate/projection'
import GenerateRoute from 'src/cli/program/generate/route'

export default class GenerateCLIProgram extends CLIProgram {
  async run(args) {
    switch(args.command) {
    case 'auth':
      return await new GenerateAuth().generate(args.args)

    case 'channel':
      return await new GenerateChannel().generate(args.args)

    case 'dream':
      return await new GenerateDream().generate(args.args)

    case 'js':
      return await new GenerateJSAPI().generate(args.args)

    case 'migration':
      return await new GenerateMigration().generate(args.args)

    case 'projection':
      return await new GenerateProjection().generate(args.args)

    case 'route':
      return await new GenerateRoute().generate(args.args)

    default:
      throw `unhandled program ${args.command} for generate command`
    }
  }
}
