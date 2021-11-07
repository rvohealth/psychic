import GenerateCLIProgram from 'src/cli/program/generate'
import File from 'src/helpers/file'

const generateCLIProgram = new GenerateCLIProgram()

describe('cli program g:auth dream:user key:email password:password', () => {
  context ('when no args are passed', () => {
    it ('generates src/components/SignIn.js', async () => {
      File.write = eavesdrop()
      await generateCLIProgram.run({ command: 'auth', args: [] })
      expect(File.write).toHaveBeenCalledWith(expect.stringContaining('src/components/SignIn.js'), expect.anything(String))
    })
  })
})
