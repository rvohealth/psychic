import GenerateCLIProgram from 'src/cli/program/generate'
import File from 'src/helpers/file'

const generateCLIProgram = new GenerateCLIProgram()


describe('cli program g:route <httpmethod> <uri> (given:<authName>)', () => {
  it ('generates a auth routes at the end of the routes file using "users" namespace', async () => {
    File.write = eavesdrop()
    await generateCLIProgram.run({
      command: 'route',
      args: [
        'get',
        'fish/johnson',
        'boys#toMen',
        'given:currentUser',
      ]
    })

    const route = (
`\
  r.given('currentUser', () => {
    r.get('fish/johnson', 'boys#toMen')
  })
`
    )
    expect(File.write).toHaveBeenCalledWith(
      'spec/support/testapp/config/routes.js',
      expect.stringContaining(route)
    )
  })
})
