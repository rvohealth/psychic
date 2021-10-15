import CLIProgram from 'src/cli/program'
import spawn from 'src/helpers/spawn'

export default class ListenCLIProgram extends CLIProgram {
  async run() {
    spawn(`yarn run psy gaze`, [], { shell: true, stdio: 'inherit' })
    spawn(`yarn start`, [], { shell: true, stdio: 'inherit' })
  }
}
