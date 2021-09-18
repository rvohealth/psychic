import GenerateCLIProgram from 'src/cli/program/generate'
import File from 'src/helpers/file'

const template =
`
import { Projection } from 'psychic'

export default class FishmanProjection extends Projection {
}
`

const generateCLIProgram = new GenerateCLIProgram()

describe('cli program g:projection <name>', () => {
  it ('generates a new projection in the projections folder with the passed name', async () => {
    File.write = eavesdrop()
    File.mkdirUnlessExists = eavesdrop()

    await generateCLIProgram.run({ command: 'projection', args: ['fishman'] })

    expect(File.mkdirUnlessExists).toHaveBeenCalledWith('app/projections')
    expect(File.write).toHaveBeenCalledWith('app/projections/fishman.js', template)
  })
})
