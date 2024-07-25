import pluralize from 'pluralize'
import Psyconf from '../../../src/psyconf'

describe('Psyconf', () => {
  let config: Psyconf

  beforeEach(() => {
    config = new Psyconf()
  })

  it('loads inflections.ts', async () => {
    await config.boot()
    expect(pluralize('paper')).toEqual('paper')
  })
})
