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
  })
})
