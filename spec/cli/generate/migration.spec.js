import GenerateCLIProgram from 'src/cli/program/generate'
import File from 'src/helpers/file'

const template =
`
export async function up(m) {
}

export async function down(m) {
}
`

const generateCLIProgram = new GenerateCLIProgram()

describe('cli program g:migration <name>', () => {
  it ('generates a new file in the migrations folder with the passed name', async () => {
    File.write = eavesdrop()
    await generateCLIProgram.run({ command: 'migration', args: ['fishman'] })
    expect(File.write).toHaveBeenCalledWith(expect.stringContaining('-fishman.js'), template.toString())
  })
})
