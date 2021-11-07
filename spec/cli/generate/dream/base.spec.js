import GenerateCLIProgram from 'src/cli/program/generate'
import File from 'src/helpers/file'

const generateCLIProgram = new GenerateCLIProgram()


describe('cli program g:migration <name>', () => {
  it ('generates a new file in the dreams folder with the passed name', async () => {
    const template =
`\
import { Dream } from 'psychic'

export default class User extends Dream {
}
`

    File.write = eavesdrop()
    await generateCLIProgram.run({ command: 'dream', args: ['user'] })
    expect(File.write).toHaveBeenCalledWith(expect.stringContaining('app/dreams/user.js'), template)
  })

  it ('generates a new file in the migrations folder with the passed name', async () => {
    const template =
`\
export async function change(m) {
  await m.createTable('users', t => {

    t.timestamps()
  })
}
`

    File.write = eavesdrop()
    await generateCLIProgram.run({ command: 'dream', args: ['users'] })
    expect(File.write).toHaveBeenCalledWith(expect.stringContaining('create-users.js'), template.toString())
  })

  context ('when text attributes are passed', () => {
    it ('adds them to template', async () => {
      const template =
`\
export async function change(m) {
  await m.createTable('users', t => {
    t.text('snapman')
    t.text('grabman')
    t.timestamps()
  })
}
`

      File.write = eavesdrop()
      await generateCLIProgram.run({ command: 'dream', args: ['user', 'text:snapman', 'text:grabman'] })
      expect(File.write).toHaveBeenCalledWith(expect.stringContaining('create-users.js'), template.toString())
    })
  })

  it ('generates a new file in the spec folder with the passed name', async () => {
    const template =
`\
import User from 'app/dreams/user'

describe ('User', () => {
})
`

    File.write = eavesdrop()
    await generateCLIProgram.run({ command: 'dream', args: ['user'] })
    expect(File.write).toHaveBeenCalledWith('spec/dreams/user.spec.js', template.toString())
  })
})
