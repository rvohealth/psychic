import GenerateCLIProgram from 'src/cli/program/generate'
import File from 'src/helpers/file'

const generateCLIProgram = new GenerateCLIProgram()

describe('cli program g:auth dream:user key:email password:password', () => {
  context ('when no args are passed', () => {
    it ('generates a dream named user with authentication bootstraps', async () => {
      const template =
`\
import { Dream } from 'psychic'

export default class User extends Dream {
  static {
    this
      .authenticates('email', 'password')
  }
}
`

      File.write = eavesdrop()
      await generateCLIProgram.run({ command: 'auth', args: [] })
      expect(File.write).toHaveBeenCalledWith(expect.stringContaining('app/dreams/user.js'), template)
    })
  })

  context ('when dream name is specified', () => {
    it ('uses passed dream name accordingly', async () => {
      const template =
`\
import { Dream } from 'psychic'

export default class FishMan extends Dream {
  static {
    this
      .authenticates('email', 'password')
  }
}
`

      File.write = eavesdrop()
      await generateCLIProgram.run({ command: 'auth', args: ['dream:fish-man'] })
      expect(File.write).toHaveBeenCalledWith(expect.stringContaining('app/dreams/fish-man.js'), template)
    })
  })

  context ('dream already exists', () => {
    it ('does not write file', async () => {
      posess(File, 'exists').returning(true)
      File.write = eavesdrop()
      await generateCLIProgram.run({ command: 'auth', args: ['dream:fish-man'] })
      expect(File.write).not.toHaveBeenCalledWith(expect.stringContaining('app/dreams/fish-man.js'), expect.anything())
    })
  })
})
