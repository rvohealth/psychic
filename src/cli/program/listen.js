import CLIProgram from 'src/cli/program'
import spawn from 'src/helpers/spawn'

export default class ListenCLIProgram extends CLIProgram {
  async run() {
    await spawn(`concurrently "yarn run gaze"`, [], { shell: true, stdio: 'inherit' })
  }
}
