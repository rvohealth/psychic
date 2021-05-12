import CLIProgram from 'src/cli/program'
import psychic from 'src/singletons/psychic'

export default class GazeCLIProgram extends CLIProgram {
  async run(args) {
    if (args.command === null) return await this.gaze()
    throw `unhandled command ${args.command}`
  }

  async gaze() {
    return psychic.gaze()
  }
}
