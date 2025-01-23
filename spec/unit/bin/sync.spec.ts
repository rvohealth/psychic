import { PsychicApplication, PsychicBin } from '../../../src'

describe('PsychicBin#on', () => {
  describe('on("sync")', () => {
    it('calls sync hooks', async () => {
      const psychicApp = PsychicApplication.getOrFail()
      const data: string[] = []

      psychicApp.on('sync', () => {
        data.push('sync hook 1')
      })

      psychicApp.on('sync', () => {
        data.push('sync hook 2')
      })

      await PsychicBin.sync()

      expect(data).toEqual(['sync hook 1', 'sync hook 2'])
    })

    // this test is checking that the return payload within test-app/conf/app.ts is
    // compiled to the psychic types file.
    it('persists returned data to the sync payload', async () => {
      await PsychicBin.sync()
      const syncFile = (await import('.../../../test-app/src/types/psychic')).default
      expect(syncFile.customField).toEqual({ customNestedField: 'custom value' })
    })
  })
})
