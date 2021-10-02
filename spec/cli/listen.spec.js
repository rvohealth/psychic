import ListenCLIProgram from 'src/cli/program/listen'
import * as spawn from 'src/helpers/spawn'

const listenCLIProgram = new ListenCLIProgram()

describe('psy listen', () => {
  it ('runs yarn start', async () => {
    const spy = posess(spawn, 'default').returning(async () => true)
    await listenCLIProgram.run({ command: null })
    expect(spy).toHaveBeenCalledWith('yarn start', [], { shell: true, stdio: 'inherit' })
  })
})
