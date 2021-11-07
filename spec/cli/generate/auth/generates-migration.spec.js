import GenerateCLIProgram from 'src/cli/program/generate'
import File from 'src/helpers/file'

const generateCLIProgram = new GenerateCLIProgram()

describe('cli program g:auth dream:user key:email password:password', () => {
  context ('when no args are passed', () => {
    it ('generates a new file in the migrations folder with defaults for password and key', async () => {
      const template =
`\
export async function change(m) {
  await m.createTable('users', t => {
    t.string('email')
    t.string('password')
    t.timestamps()
  })
}
`

      File.write = eavesdrop()
      await generateCLIProgram.run({ command: 'auth', args: [] })
      expect(File.write).toHaveBeenCalledWith(expect.stringContaining('create-users.js'), template.toString())
    })
  })

  context ('when dream name and fields are specified', () => {
    it ('uses passed dream name, key and password fields accordingly', async () => {
      const template =
`\
export async function change(m) {
  await m.createTable('consumers', t => {
    t.string('email_account')
    t.string('secret')
    t.timestamps()
  })
}
`

      File.write = eavesdrop()
      await generateCLIProgram.run({ command: 'auth', args: ['dream:consumer', 'key:email_account', 'password:secret'] })
      expect(File.write).toHaveBeenCalledWith(expect.stringContaining('create-consumers.js'), template)
    })
  })
})
