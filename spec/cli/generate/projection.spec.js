import GenerateCLIProgram from 'src/cli/program/generate'
import Dir from 'src/helpers/dir'

const template =
`
import { Projection } from 'psychic'

export default class FishmanDogbonesProjection extends Projection {
}
`

const generateCLIProgram = new GenerateCLIProgram()

describe('cli program g:projection <name>', () => {
  it ('generates a new projection in the projections folder with the passed name', async () => {
    const writeSpy = posess(Dir, 'write').returning(true)
    const mkdirUnlessExistsSpy = posess(Dir, 'mkdirUnlessExists').returning(true)

    await generateCLIProgram.run({ command: 'projection', args: ['fishman_dogbones'] })

    expect(mkdirUnlessExistsSpy).toHaveBeenCalledWith('app/projections')
    expect(writeSpy).toHaveBeenCalledWith('app/projections/fishman-dogbones.js', template)
  })
})
