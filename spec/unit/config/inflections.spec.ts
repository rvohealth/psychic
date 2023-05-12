import PsychicConfig from '../../../src/config'
import PsychicServer from '../../../src/server'
import pluralize from 'pluralize'

describe('PsychicConfig', () => {
  let config: PsychicConfig

  beforeEach(() => {
    config = new PsychicConfig(new PsychicServer().app)
  })

  it('loads inflections.ts', async () => {
    await config.boot()
    expect(pluralize('paper')).toEqual('paper')
  })
})
