import PsychicBin from '../../../src/bin/index.js'
import generateController from '../../../src/generate/controller.js'

vi.mock('../../../src/generate/controller.js')

describe('PsychicBin.generateController', () => {
  it('refuses to replace differing files by default', async () => {
    await PsychicBin.generateController('V1/Reports', ['download'])

    expect(generateController).toHaveBeenCalledWith({
      fullyQualifiedControllerName: 'V1/Reports',
      actions: ['download'],
      singular: false,
      overwrite: false,
    })
  })

  it('passes overwrite through', async () => {
    await PsychicBin.generateController('V1/Reports', ['download'], { overwrite: true })

    expect(generateController).toHaveBeenCalledWith({
      fullyQualifiedControllerName: 'V1/Reports',
      actions: ['download'],
      singular: false,
      overwrite: true,
    })
  })
})
