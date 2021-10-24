import Dir from 'src/helpers/dir'

describe('Landing on home page of boiler-plate react app', () => {
  beforeEach(async () => {
    await runPsyCommand(`CORE_INTEGRATION_TEST=true npm run psy g:auth`)
  })

  it('should have content "Psychic"', async () => {
    await goto(baseUrl)
    await expect(page).toMatch('Psychic')
    console.log(await Dir.read('tmp/integrationtestapp/app/dreams'))
  })
})
