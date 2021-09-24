import SpecCLIProgram from 'src/cli/program/spec'
import * as spawn from 'src/helpers/spawn'
import Dir from 'src/helpers/dir'

const specCLIProgram = new SpecCLIProgram()

describe('psy spec', () => {
  it ('runs yarn spec in spawn, sending stdout to main', async () => {
    const spy = posess(spawn, 'default').returning(async () => true)
    await specCLIProgram.run({ command: null })

    for (const folder of await Dir.readdir('spec')) {
      if (await Dir.isDir(`spec/${folder}`))
        expect(spy).toHaveBeenCalledWith(`yarn test ./spec/${folder} --forceExit`, [], { shell: true, stdio: 'inherit' })
    }
  })

  context ('a specific file is passed', () => {
    it ('passes the file into the command', async () => {
      const spy = posess(spawn, 'default').returning(async () => true)
      await specCLIProgram.run({ command: null, args: ['fishman.spec.js'] })
      expect(spy).toHaveBeenCalledWith('yarn test fishman.spec.js --forceExit', [], { shell: true, stdio: 'inherit' })
    })
  })
})


