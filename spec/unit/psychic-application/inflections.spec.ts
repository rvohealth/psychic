import pluralize from 'pluralize-esm'
import PsychicApp from '../../../src/psychic-app/index.js'

describe('PsychicApp', () => {
  let config: PsychicApp

  beforeEach(() => {
    config = new PsychicApp()
  })

  it('loads inflections.ts', async () => {
    await config.boot()
    expect(pluralize('paper')).toEqual('paper')
  })
})
