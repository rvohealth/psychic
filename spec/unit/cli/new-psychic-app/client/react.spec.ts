import newPsychicApp from '../../../../../global-cli/helpers/newPsychicApp'
import { expectApiOnly, expectReactClient, readHowyadoinFile, removeHowyadoinDir } from '../helpers/assertion'

describe('newPsychicApp (client options)', () => {
  beforeEach(async () => {
    process.env.REALLY_BUILD_CLIENT_DURING_SPECS = '1'
    await removeHowyadoinDir()
  })

  afterEach(async () => {
    process.env.REALLY_BUILD_CLIENT_DURING_SPECS = undefined
    await removeHowyadoinDir()
  })

  it(
    'provisions a react app',
    async () => {
      await newPsychicApp('howyadoin', ['--redis', '--ws', '--client', 'react', '--primaryKey', 'bigserial'])

      const appTsContent = await readHowyadoinFile('api/src/conf/app.ts')

      expectApiOnly(false, appTsContent)
      await expectReactClient()
    },
    2 * 60000,
  )
})
