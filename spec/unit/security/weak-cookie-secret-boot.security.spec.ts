import * as LoadControllersModule from '../../../src/psychic-app/helpers/import/importControllers.js'
import PsychicApp from '../../../src/psychic-app/index.js'
import importDefault from '../../../test-app/src/app/helpers/importDefault.js'
import dreamCb from '../../../test-app/src/conf/dream.js'

// R-003 / Phase 3 — an app configured with an invalid cookie-encryption key
// previously booted successfully (the key was only console.warn'd) and failed
// at runtime the first time a cookie was encrypted. In production this left
// users with mysterious session errors long after the deploy. The audit
// flipped the non-production path to a loud console.warn and production to a
// fail-closed boot throw.

describe('invalid cookie encryption key (Phase 3)', () => {
  beforeEach(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
    vi.spyOn(LoadControllersModule, 'default').mockResolvedValue({} as any)
  })

  const cbWithInvalidKey = async (app: PsychicApp) => {
    app.set('apiRoot', 'how/yadoin')
    app.set('routes', () => {})
    app.set('packageManager', 'yarn')
    app.set('encryption', {
      cookies: {
        current: { algorithm: 'aes-256-gcm', key: 'definitely-not-a-valid-base64-32-byte-key' },
      },
    })
    await app.load('controllers', 'how/yadoin', path => importDefault(path))
  }

  context('in production', () => {
    let originalNodeEnv: string | undefined
    beforeEach(() => {
      originalNodeEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'
    })
    afterEach(() => {
      process.env.NODE_ENV = originalNodeEnv
    })

    it('refuses to boot with an invalid cookie encryption key', async () => {
      await expect(PsychicApp.init(cbWithInvalidKey, dreamCb)).rejects.toThrow(
        /key value for cookies encryption is invalid/,
      )
    })
  })

  context('in non-production', () => {
    it('warns but does not throw', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      try {
        await expect(PsychicApp.init(cbWithInvalidKey, dreamCb)).resolves.not.toThrow()
        expect(warnSpy).toHaveBeenCalledWith(
          expect.stringMatching(/key value for cookies encryption is invalid/),
        )
      } finally {
        warnSpy.mockRestore()
      }
    })
  })
})
