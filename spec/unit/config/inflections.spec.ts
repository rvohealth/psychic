import HowlConfig from '../../../src/config'
import HowlServer from '../../../src/server'
import * as pluralize from 'pluralize'

describe('HowlConfig', () => {
  let config: HowlConfig

  beforeEach(() => {
    config = new HowlConfig(new HowlServer().app)
  })

  it('loads inflections.ts', async () => {
    await config.boot()
    expect(pluralize('paper')).toEqual('paper')
  })
})
