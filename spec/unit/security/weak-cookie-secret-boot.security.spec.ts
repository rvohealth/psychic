import { Encrypt } from '@rvoh/dream/utils'
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

// ITEM8-02 — PsychicApp.init previously validated only the `current` cookie
// encryption key at boot. A malformed `legacy` key (used for cookie-decryption
// fallback after a key rotation) passed boot and only surfaced as a 500 at the
// first legacy-fallback cookie. Boot now validates `legacy` too, using the same
// fail-closed-in-production mechanism as `current`, and names it as the legacy
// key so a misconfigured rotation is not mistaken for the current key.

describe('invalid legacy cookie encryption key (ITEM8-02)', () => {
  const validCurrentKey = Encrypt.generateKey('aes-256-gcm')

  beforeEach(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
    vi.spyOn(LoadControllersModule, 'default').mockResolvedValue({} as any)
  })

  const cbWithKeys = (legacyKey: string | undefined) => async (app: PsychicApp) => {
    app.set('apiRoot', 'how/yadoin')
    app.set('routes', () => {})
    app.set('packageManager', 'yarn')
    app.set('encryption', {
      cookies: {
        current: { algorithm: 'aes-256-gcm', key: validCurrentKey },
        ...(legacyKey === undefined ? {} : { legacy: { algorithm: 'aes-256-gcm' as const, key: legacyKey } }),
      },
    })
    await app.load('controllers', 'how/yadoin', path => importDefault(path))
  }

  context('when the legacy key is invalid', () => {
    context('in production', () => {
      let originalNodeEnv: string | undefined
      beforeEach(() => {
        originalNodeEnv = process.env.NODE_ENV
        process.env.NODE_ENV = 'production'
      })
      afterEach(() => {
        process.env.NODE_ENV = originalNodeEnv
      })

      it('refuses to boot and names the legacy key', async () => {
        await expect(
          PsychicApp.init(cbWithKeys('definitely-not-a-valid-base64-32-byte-key'), dreamCb),
        ).rejects.toThrow(/legacy key value for cookies encryption is invalid/)
      })
    })
  })

  context('when the legacy key is valid', () => {
    it('boots without throwing', async () => {
      await expect(
        PsychicApp.init(cbWithKeys(Encrypt.generateKey('aes-256-gcm')), dreamCb),
      ).resolves.not.toThrow()
    })
  })

  context('when no legacy key is configured', () => {
    it('boots without throwing', async () => {
      await expect(PsychicApp.init(cbWithKeys(undefined), dreamCb)).resolves.not.toThrow()
    })
  })
})
