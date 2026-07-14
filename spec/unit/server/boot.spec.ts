import { PsychicApp, PsychicServer } from '../../../src/package-exports/index.js'

describe('PsychicServer#boot', () => {
  context('when booting the psychic app fails', () => {
    let originalError: Error

    beforeEach(() => {
      originalError = new Error('original boot failure')
      vi.spyOn(PsychicApp.prototype, 'boot').mockRejectedValue(originalError)
      vi.spyOn(PsychicApp, 'logWithLevel').mockReturnValue(undefined)
    })

    afterEach(() => {
      vi.restoreAllMocks()
    })

    it('rethrows with the original error preserved as cause', async () => {
      const server = new PsychicServer()

      await expect(server.boot()).rejects.toMatchObject({
        message: expect.stringContaining('Failed to boot psychic config') as string,
        cause: originalError,
      })
    })
  })
})
