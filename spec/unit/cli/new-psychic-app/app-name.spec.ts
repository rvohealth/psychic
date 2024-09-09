import newPsychicApp from '../../../../src/global-cli/helpers/newPsychicApp'
import { expectAppName, readHowyadoinFile, removeHowyadoinDir } from './helpers/assertion'

describe('newPsychicApp (app name)', () => {
  beforeEach(async () => {
    await removeHowyadoinDir()
  })

  afterEach(async () => {
    await removeHowyadoinDir()
  })

  it('sets the appName field in the conf/app.ts file', async () => {
    await newPsychicApp('howyadoin', ['--redis', '--ws', '--client', 'react', '--primaryKey', 'bigserial'])

    const appTsContent = await readHowyadoinFile('api/src/conf/app.ts')
    expectAppName('howyadoin', appTsContent)
  })
})
