import { PsychicBin } from '../../../src/index.js'

describe('PsychicBin#on', () => {
  describe('on("sync")', () => {
    // this test is checking that the return payload within test-app/conf/app.ts is
    // compiled to the psychic types file.
    it('persists returned data to the sync payload', async () => {
      await PsychicBin.sync()
      const syncFile = (await import('../../../test-app/src/types/psychic.js')).default
      expect(syncFile.customField).toEqual({ customNestedField: 'custom value' })
    }, 15_000)
  })
})
