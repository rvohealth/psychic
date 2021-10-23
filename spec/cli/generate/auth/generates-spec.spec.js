import GenerateCLIProgram from 'src/cli/program/generate'
import File from 'src/helpers/file'

const generateCLIProgram = new GenerateCLIProgram()

describe('cli program g:auth dream:user key:email password:password', () => {
  context ('when no args are passed', () => {
    it ('generates spec/dreams/user.spec.js', async () => {
      const template =
`\
import User from 'app/dreams/user'

describe ('User', () => {
})
`

      File.write = eavesdrop()
      await generateCLIProgram.run({ command: 'auth', args: [] })
      expect(File.write).toHaveBeenCalledWith(expect.stringContaining('spec/dreams/user.spec.js'), template)
    })
  })

  context ('when dream name is specified', () => {
    it ('uses passed dream name accordingly', async () => {
      const template =
`\
import Consumer from 'app/dreams/consumer'

describe ('Consumer', () => {
})
`

      File.write = eavesdrop()
      await generateCLIProgram.run({ command: 'auth', args: ['dream:consumer'] })
      expect(File.write).toHaveBeenCalledWith(expect.stringContaining('spec/dreams/consumer.spec.js'), template)
    })
  })

  context ('spec already exists', () => {
    it ('does not write file', async () => {
      posess(File, 'exists').returning(true)
      File.write = eavesdrop()
      await generateCLIProgram.run({ command: 'auth', args: ['dream:fish-man'] })
      expect(File.write).not.toHaveBeenCalledWith(expect.stringContaining('spec/dreams/fish-man.js'), expect.anything())
    })
  })
})
