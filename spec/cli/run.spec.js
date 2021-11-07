import RunCLIProgram from 'src/cli/program/run'
import File from 'src/helpers/file'
// import * as spawn from 'src/helpers/spawn'

const runCLIProgram = new RunCLIProgram()

const template =
`
async () => {
  await File.write('tmp/coolidge.js', 'console.log("coolidge")')
}
`

describe('psy run file.js', () => {
  beforeEach(async () => {
    await File.rm('tmp/coolidge.js')
  })

  it ('runs yarn start', async () => {
    await File.write('tmp/testfile.js', template)
    await runCLIProgram.run({ command: null, args: [ 'tmp/testfile.js' ] })
    expect(await File.exists('tmp/coolidge.js')).toBe(true)
  })
})
