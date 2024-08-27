import { describe as context } from '@jest/globals'
import newPsychicApp from '../../../../global-cli/helpers/newPsychicApp'
import {
  expectReactClient,
  expectRedis,
  expectWs,
  readHowyadoinFile,
  removeHowyadoinDir,
} from './helpers/assertion'

describe('newPsychicApp (ws options)', () => {
  beforeEach(async () => {
    await removeHowyadoinDir()
  })

  afterEach(async () => {
    await removeHowyadoinDir()
  })

  it('sets ws to true in conf/app.ts', async () => {
    await newPsychicApp('howyadoin', ['--redis', '--ws', '--client', 'react', '--primaryKey', 'bigserial'])

    const appTsContent = await readHowyadoinFile('api/src/conf/app.ts')

    expectRedis(true, appTsContent)
    expectWs(true, appTsContent)

    await expectReactClient()
  })

  context('ws is set to false', () => {
    it('sets ws to false in conf/app.ts', async () => {
      await newPsychicApp('howyadoin', [
        '--redis',
        '--ws',
        'false',

        '--client',
        'react',

        '--primaryKey',
        'bigserial',
      ])

      const appTsContent = await readHowyadoinFile('api/src/conf/app.ts')

      expectRedis(true, appTsContent)
      expectWs(false, appTsContent)

      await expectReactClient()
    })
  })

  context('ws is explicitly set to true', () => {
    it('sets ws to true in conf/app.ts', async () => {
      await newPsychicApp('howyadoin', [
        '--redis',
        '--ws',
        'true',

        '--client',
        'react',

        '--primaryKey',
        'bigserial',
      ])

      const appTsContent = await readHowyadoinFile('api/src/conf/app.ts')

      expectRedis(true, appTsContent)
      expectWs(true, appTsContent)

      await expectReactClient()
    })
  })
})
