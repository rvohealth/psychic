import GenerateCLIProgram from 'src/cli/program/generate'
import File from 'src/helpers/file'

const generateCLIProgram = new GenerateCLIProgram()

const expectedRouteTemplate = `\
import common from 'psy/net/common'

export default class TestsAPI {
  static testdelete(opts) {
    return common.delete(\`/testdelete\`, opts)
  }

  static testget(opts) {
    return common.get(\`/testget\`, opts)
  }

  static testpatch(opts) {
    return common.patch(\`/testpatch\`, opts)
  }

  static testpost(opts) {
    return common.post(\`/testpost\`, opts)
  }

  static testput(opts) {
    return common.put(\`/testput\`, opts)
  }
}
`

describe('cli program g:channel <name>', () => {
  it ('generates a new channel in the channels folder with the passed name', async () => {
    await generateCLIProgram.run({ command: 'js', args: [] })
    const file = await File.read('tmp/spec/psy/net/tests.js')
    expect(file.toString()).toEqual(expectedRouteTemplate)
  })
})

