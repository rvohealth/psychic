import GenerateCLIProgram from 'src/cli/program/generate'
import File from 'src/helpers/file'

const template =
`
export async function up(m) {
  m.createTable('test-users', t => {
    t.char('johnson')
  })
}

export async function down(m) {
  m.dropTable('test-users')
}
`

const generateCLIProgram = new GenerateCLIProgram()

describe('cli program g:migration <name> string:<columnname>', () => {
  it ('creates an int column', async () => {
    File.write = eavesdrop()
    await generateCLIProgram.run({ command: 'migration', args: ['TestUser', 'char:johnson'] })

    expect(File.write).toHaveBeenCalledWith(expect.stringContaining('create-test-users.js'), template)
  })
})
