import GenerateCLIProgram from 'src/cli/program/generate'
import File from 'src/helpers/file'

const template =
`
export async function change(m) {
  m.createTable('test-users', t => {
    t.array('johnson')
  })
}
`

const generateCLIProgram = new GenerateCLIProgram()

describe('cli program g:migration <name> string:<columnname>', () => {
  it ('creates an int column', async () => {
    File.write = eavesdrop()
    await generateCLIProgram.run({ command: 'migration', args: ['TestUser', 'array:johnson'] })
    expect(File.write).toHaveBeenCalledWith(expect.stringContaining('create-test-users.js'), template)
  })
})
