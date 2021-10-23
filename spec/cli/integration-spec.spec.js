import IntegrationSpecCLIProgram from 'src/cli/program/integration-spec'
import * as spawn from 'src/helpers/spawn'

const intspecCLIProgram = new IntegrationSpecCLIProgram()

describe('psy intspec', () => {
  it ('runs yarn run integration-spec in spawn, passing integration jest config and sending stdout to main', async () => {
    const spy = posess(spawn, 'default').returning(async () => true)
    await intspecCLIProgram.run({ command: null })
    expect(spy).toHaveBeenCalledWith(`yarn run integration-spec --forceExit`, [], { shell: true, stdio: 'inherit' })
  })

  context ('a specific file is passed', () => {
    it ('passes the file into the command', async () => {
      const spy = posess(spawn, 'default').returning(async () => true)
      await intspecCLIProgram.run({ command: null, args: ['fishman.spec.js'] })
      expect(spy).toHaveBeenCalledWith(`yarn run integration-spec-untargeted fishman.spec.js --forceExit`, [], { shell: true, stdio: 'inherit' })
    })
  })
})


