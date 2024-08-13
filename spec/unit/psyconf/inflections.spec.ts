import pluralize from 'pluralize'
import PsychicApplication from '../../../src/psychic-application'

describe('PsychicApplication', () => {
  let config: PsychicApplication

  beforeEach(() => {
    config = new PsychicApplication()
  })

  it('loads inflections.ts', async () => {
    await config.boot()
    expect(pluralize('paper')).toEqual('paper')
  })
})
