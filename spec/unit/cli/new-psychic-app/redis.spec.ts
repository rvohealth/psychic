import { describe as context } from '@jest/globals'
import newPsychicApp from '../../../../src/global-cli/helpers/newPsychicApp'
import { expectRedis, readHowyadoinFile, removeHowyadoinDir } from './helpers/assertion'

describe('newPsychicApp (ws options)', () => {
  beforeEach(async () => {
    await removeHowyadoinDir()
  })

  afterEach(async () => {
    await removeHowyadoinDir()
  })

  it('sets redis to true in conf/app.ts', async () => {
    await newPsychicApp('howyadoin', ['--redis', '--ws', '--client', 'react', '--primaryKey', 'bigserial'])

    const appTsContent = await readHowyadoinFile('api/src/conf/app.ts')
    expectRedis(true, appTsContent)
  })

  context('redis is set to false', () => {
    it('sets redis to false in conf/app.ts', async () => {
      await newPsychicApp('howyadoin', [
        '--redis',
        'false',
        '--ws',

        '--client',
        'react',

        '--primaryKey',
        'bigserial',
      ])

      const appTsContent = await readHowyadoinFile('api/src/conf/app.ts')
      expectRedis(false, appTsContent)
    })
  })

  context('redis is explicitly set to true', () => {
    it('sets redis to true in conf/app.ts', async () => {
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
    })
  })
})
