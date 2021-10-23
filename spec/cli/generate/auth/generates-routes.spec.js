import GenerateCLIProgram from 'src/cli/program/generate'
import File from 'src/helpers/file'

const generateCLIProgram = new GenerateCLIProgram()


describe('cli program g:auth dream:user key:email password:password', () => {
  context ('when no args are passed', () => {
    it ('generates a auth routes at the end of the routes file using "users" namespace', async () => {
      File.write = eavesdrop()
      await generateCLIProgram.run({ command: 'auth', args: [] })

      const expectedRoutes = [
        `r.post('users', 'users#create')`,
        `r.post('auth', 'users#auth')`,
        `r.delete('auth', 'users#signout')`,
      ]

      expectedRoutes.forEach(route => {
        expect(File.write).toHaveBeenCalledWith(
          'spec/support/testapp/config/routes.js',
          expect.stringContaining(route)
        )
      })
    })
  })

  context ('when dream is passed', () => {
    it ('generates a auth routes at the end of the routes file using passed dreamname for namespace', async () => {
      File.write = eavesdrop()
      await generateCLIProgram.run({ command: 'auth', args: ['dream:consumer'] })

      const expectedRoutes = [
        `r.post('consumers', 'consumers#create')`,
        `r.post('auth', 'consumers#auth')`,
        `r.delete('auth', 'consumers#signout')`,
      ]

      expectedRoutes.forEach(route => {
        expect(File.write).toHaveBeenCalledWith(
          'spec/support/testapp/config/routes.js',
          expect.stringContaining(route)
        )
      })
    })
  })
})
