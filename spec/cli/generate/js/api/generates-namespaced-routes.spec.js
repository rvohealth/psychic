import GenerateCLIProgram from 'src/cli/program/generate'
import File from 'src/helpers/file'

const generateCLIProgram = new GenerateCLIProgram()

const expectedRouteTemplate = `\
import common from 'psy/net/common'

export default class TestsAPI {
  static namespacetest(opts) {
    return common.get(\`/testapi/v1/namespacetest\`, opts)
  }
}
`

describe('cli program g:net', () => {
  it ('generates namespaced routes correctly', async () => {
    await generateCLIProgram.run({ command: 'net', args: [] })
    const file = await File.read('tmp/spec/psy/net/testapi/v1/tests.js')
    expect(file.toString()).toEqual(expectedRouteTemplate)
  })
})
