import CommandArgs from 'src/cli/args.js'
import DBCLIProgram from 'src/cli/program/db'
import MigrateCLIProgram from 'src/cli/program/migrate.js'
import GazeCLIProgram from 'src/cli/program/gaze'
import GenerateCLIProgram from 'src/cli/program/generate'
import NewAppProgram from 'src/cli/program/new-app'
import SpecCLIProgram from 'src/cli/program/spec'
import IntegrationSpecCLIProgram from 'src/cli/program/integration-spec'
import StoriesCLIProgram from 'src/cli/program/stories'
import ListenCLIProgram from 'src/cli/program/listen'
import BuildintspecCLIProgram from 'src/cli/program/buildintspec'

export default class CLI {
  get args() {
    if (this._args) return this._args
    this._args = new CommandArgs()
    return this._args
  }

  get program() {
    switch(this.args.program) {
    case 'buildintspec':
      return new BuildintspecCLIProgram()

    case 'db':
      return new DBCLIProgram()

    case 'gaze':
      return new GazeCLIProgram()

    case 'generate':
    case 'gen':
    case 'g':
      return new GenerateCLIProgram()

    case 'ispec':
    case 'intspec':
    case 'integrations':
    case 'integration-spec':
      return new IntegrationSpecCLIProgram()

    case 'listen':
    case 'start':
      return new ListenCLIProgram()

    case 'migrate':
      return new MigrateCLIProgram()

    case 'new':
      return new NewAppProgram()

    case 'spec':
      return new SpecCLIProgram()

    case 'features':
    case 'stories':
    case 'story':
      return new StoriesCLIProgram()

    default:
      throw `Unkown program ${this.args.program}`
    }
  }

  async run() {
    return await this.program.run(this.args)
  }
}
