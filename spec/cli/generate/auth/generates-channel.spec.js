import GenerateCLIProgram from 'src/cli/program/generate'
import File from 'src/helpers/file'

const generateCLIProgram = new GenerateCLIProgram()

describe('cli program g:auth dream:user key:email password:password', () => {
  context ('when no args are passed', () => {
    it ('generates a channel named users with authentication bootstraps', async () => {
      const template =
`\
import { Channel } from 'psychic'

export default class Users extends Channel {
  initialize() {
    this
      .authenticates('email', 'password')
  }
}
`

      File.write = eavesdrop()
      await generateCLIProgram.run({ command: 'auth', args: [] })
      expect(File.write).toHaveBeenCalledWith(expect.stringContaining('app/channels/users.js'), template)
    })
  })

  context ('when dream name is specified', () => {
    it ('uses passed dream name accordingly', async () => {
      const template =
`\
import { Channel } from 'psychic'

export default class Consumers extends Channel {
  initialize() {
    this
      .authenticates('email_account', 'passcode')
  }
}
`

      File.write = eavesdrop()
      await generateCLIProgram.run({ command: 'auth', args: ['dream:consumer', 'key:email_account', 'password:passcode'] })
      expect(File.write).toHaveBeenCalledWith(expect.stringContaining('app/channels/consumers.js'), template)
    })
  })

  context ('channel already exists', () => {
    it ('does not write file', async () => {
      posess(File, 'exists').returning(true)
      File.write = eavesdrop()
      await generateCLIProgram.run({ command: 'auth', args: [] })
      expect(File.write).not.toHaveBeenCalledWith(expect.stringContaining('app/channels/users.js'), expect.anything())
    })
  })
})
