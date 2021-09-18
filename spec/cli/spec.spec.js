import SpecCLIProgram from 'src/cli/program/spec'
import * as spawn from 'src/helpers/spawn'

const specCLIProgram = new SpecCLIProgram()

describe('psy spec', () => {
  it ('runs yarn spec in spawn, sending stdout to main', async () => {
    const spy = posess(spawn, 'default').returning(async () => true)
    await specCLIProgram.run({ command: null })
    expect(spy).toHaveBeenCalledWith('yarn test', [], { shell: true, stdio: 'inherit' })
  })

  context ('a specific file is passed', () => {
    it ('passes the file into the command', async () => {
      const spy = posess(spawn, 'default').returning(async () => true)
      await specCLIProgram.run({ command: null, args: ['fishman.spec.js'] })
      expect(spy).toHaveBeenCalledWith('yarn test fishman.spec.js', [], { shell: true, stdio: 'inherit' })
    })
  })
})


