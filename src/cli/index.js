import CommandArgs from 'src/cli/args.js'
import DBCLIProgram from 'src/cli/program/db'
import MigrateCLIProgram from 'src/cli/program/migrate.js'
import GazeCLIProgram from 'src/cli/program/gaze'
import GenerateCLIProgram from 'src/cli/program/generate'
import NewAppProgram from 'src/cli/program/new-app'

export default class CLI {
  get args() {
    if (this._args) return this._args
    this._args = new CommandArgs()
    return this._args
  }

  get program() {
    switch(this.args.program) {
    case 'db':
      return new DBCLIProgram()

    case 'gaze':
      return new GazeCLIProgram()

    case 'generate':
    case 'gen':
    case 'g':
      return new GenerateCLIProgram()

    case 'migrate':
      return new MigrateCLIProgram()

    case 'new':
      return new NewAppProgram()
    default:
      throw `Unkown program ${this.args.program}`
    }
  }

  async run() {
    return await this.program.run(this.args)
  }
}
