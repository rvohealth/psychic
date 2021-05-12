import CLIProgram from 'src/cli/program/index.js'
import RunMigration from 'src/migrate/run'

export default class MigrateCLIProgram extends CLIProgram {
  async run(args) {
    switch(args.command) {

    case null:
      await new RunMigration().run()
      return process.exit()

    default:
      throw `unrecognized command ${this.args.command}`
    }
  }
}
