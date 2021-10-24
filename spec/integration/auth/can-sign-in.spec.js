import spawn from 'src/helpers/spawn'
import Dir from 'src/helpers/dir'

describe('Landing on home page of boiler-plate react app', () => {
  beforeEach(async () => {
    await spawn(
      `CORE_INTEGRATION_TEST=true npm run psy g:auth`,
      [],
      {
        shell: true,
        stdio: 'inherit',
        cwd: 'tmp/integrationtestapp',
        env: {
          ...process.env,
          CORE_INTEGRATION_TEST: true,
        }
      }
    )
  })

  it('should have content "Psychic"', async () => {
    await goto(baseUrl)
    await expect(page).toMatch('Psychic')
    console.log(await Dir.read('tmp/integrationtestapp/app/dreams'))
  })
})
