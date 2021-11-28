import GenerateCLIProgram from 'src/cli/program/generate'
import File from 'src/helpers/file'
import config from 'src/config'

const generateCLIProgram = new GenerateCLIProgram()

const expectedRoutesTemplate = `\
export default {
  testget: 'testget',
  testpost: 'testpost',
  testput: 'testput',
  testpatch: 'testpatch',
  testdelete: 'testdelete',
  testUsers: {
    index: 'test-users',
    show: id => \`test-users/$\{id}\`,
    create: 'test-users',
    update: id => \`test-users/$\{id}\`,
    delete: id => \`test-users/$\{id}\`,
  },
  testapi: {
    v1: {
      namespacetest: 'testapi/v1/namespacetest',
      testUsers: {
        index: 'testapi/v1/test-users',
        show: id => \`testapi/v1/test-users/$\{id}\`,
        create: 'testapi/v1/test-users',
        update: id => \`testapi/v1/test-users/$\{id}\`,
        delete: id => \`testapi/v1/test-users/$\{id}\`,
      },
    },
  },
}
`

describe('cli program g:server-routes', () => {
  beforeEach(() => {
    posess(config, 'schema', 'get').returning({
      test_users: {
        id: {
          name: 'id',
          type: 'int',
        },
        email: {
          name: 'email',
          type: 'text',
        },
      }
    })
  })

  it ('generates a routes file with the correct path and contents', async () => {
    await generateCLIProgram.run({ command: 'server-routes', args: [] })
    const file = await File.text('spec/support/testapp/app/pkg/routes.pkg.js')
    expect(file).toEqual(expectedRoutesTemplate)
  })
})
