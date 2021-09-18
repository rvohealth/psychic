import GenerateCLIProgram from 'src/cli/program/generate'
import File from 'src/helpers/file'

const generateCLIProgram = new GenerateCLIProgram()

describe('cli program db:create', () => {
  it ('creates the database, building out the migrations table as well', async () => {
    const template = await File.read('src/cli/program/generate/template/migration/blank.template.js')
    File.write = eavesdrop()
    await generateCLIProgram.run({ command: 'migration', args: ['fishman'] })
    expect(File.write).toHaveBeenCalledWith(expect.stringContaining('-fishman.js'), template.toString())
  })
})
