import GenerateCLIProgram from 'src/cli/program/generate'
import File from 'src/helpers/file'

const generateCLIProgram = new GenerateCLIProgram()

const expectedRouteTemplate = `\
import common from 'psy/net/common'

export default class TestUsersAPI {
  static create(opts) {
    return common.post(\`/test-users\`, opts)
  }

  static delete(id, opts) {
    return common.delete(\`/test-users/$\{id}\`, opts)
  }

  static index(opts) {
    return common.get(\`/test-users\`, opts)
  }

  static patch(id, opts) {
    return common.patch(\`/test-users/$\{id}\`, opts)
  }

  static put(id, opts) {
    return common.put(\`/test-users/$\{id}\`, opts)
  }

  static show(id, opts) {
    return common.get(\`/test-users/$\{id}\`, opts)
  }
}
`

describe('cli program g:net', () => {
  it ('generates resource api file correctly', async () => {
    await generateCLIProgram.run({ command: 'net', args: [] })
    const file = await File.read('tmp/spec/psy/net/test-users.js')
    expect(file.toString()).toEqual(expectedRouteTemplate)
  })
})
