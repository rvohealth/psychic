import PsychicBin from '../../../src/bin/index.js'
import generateResource from '../../../src/generate/resource.js'

vi.mock('../../../src/generate/resource.js')

describe('PsychicBin.generateResource', () => {
  const options = {
    singular: true,
    only: 'show,update',
    stiBaseSerializer: false,
    owningModel: 'User',
    connectionName: 'default',
    softDelete: false,
  }

  function resourceOptionsPassed() {
    expect(generateResource).toHaveBeenCalledTimes(1)
    return vi.mocked(generateResource).mock.calls[0]?.[0].options
  }

  it('passes its options through, refusing to replace existing files by default', async () => {
    await PsychicBin.generateResource('v1/profile', 'User/Profile', ['bio:text'], options)

    expect(generateResource).toHaveBeenCalledWith({
      route: 'v1/profile',
      fullyQualifiedModelName: 'User/Profile',
      columnsWithTypes: ['bio:text'],
      options: { ...options, existingFiles: 'refuse' },
    })
  })

  it('passes overwrite through', async () => {
    await PsychicBin.generateResource('v1/profile', 'User/Profile', [], { ...options, overwrite: true })

    expect(resourceOptionsPassed()).toEqual({ ...options, existingFiles: 'overwrite' })
  })

  it('passes overwritePsychicOnly through', async () => {
    await PsychicBin.generateResource('v1/profile', 'User/Profile', [], {
      ...options,
      overwritePsychicOnly: true,
    })

    expect(resourceOptionsPassed()).toEqual({ ...options, existingFiles: 'overwritePsychicOnly' })
  })

  it('rejects overwrite with overwritePsychicOnly before generating anything', async () => {
    await expect(
      PsychicBin.generateResource('v1/profile', 'User/Profile', [], {
        ...options,
        overwrite: true,
        overwritePsychicOnly: true,
      }),
    ).rejects.toThrow('overwrite and overwritePsychicOnly cannot be combined')

    expect(generateResource).not.toHaveBeenCalled()
  })
})
