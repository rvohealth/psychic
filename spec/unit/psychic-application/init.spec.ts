import PsychicAppInitMissingApiRoot from '../../../src/error/psychic-app/init-missing-api-root.js'
import PsychicAppInitMissingCallToLoadControllers from '../../../src/error/psychic-app/init-missing-call-to-load-controllers.js'
import PsychicAppInitMissingPackageManager from '../../../src/error/psychic-app/init-missing-package-manager.js'
import PsychicAppInitMissingRoutesCallback from '../../../src/error/psychic-app/init-missing-routes-callback.js'
import { PsychicApp } from '../../../src/index.js'
import * as LoadControllersModule from '../../../src/psychic-app/helpers/import/importControllers.js'
import importDefault from '../../../test-app/src/app/helpers/importDefault.js'
import dreamCb from '../../../test-app/src/conf/dream.js'

describe('PsychicApp#init', () => {
  beforeEach(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
    vi.spyOn(LoadControllersModule, 'default').mockResolvedValue({} as any)
  })

  context('with a valid config', () => {
    it('does not raise an exception', async () => {
      const cb = async (app: PsychicApp) => {
        app.set('apiRoot', 'how/yadoin')
        app.set('routes', () => {})
        app.set('packageManager', 'yarn')
        await app.load('controllers', 'how/yadoin', path => importDefault(path))
      }

      await expect(PsychicApp.init(cb, dreamCb)).resolves.not.toThrow()
    })
  })

  context('with an invalid config', () => {
    context('load("controllers") never called', () => {
      it('throws targeted exception', async () => {
        const cb = (app: PsychicApp) => {
          app.set('apiRoot', 'how/yadoin')
          app.set('routes', () => {})
          app.set('packageManager', 'yarn')
        }

        await expect(PsychicApp.init(cb, dreamCb)).rejects.toThrow(PsychicAppInitMissingCallToLoadControllers)
      })
    })

    context('apiRoot not set', () => {
      it('throws targeted exception', async () => {
        const cb = async (app: PsychicApp) => {
          await app.load('controllers', 'how/yadoin', path => importDefault(path))
          app.set('routes', () => {})
          app.set('packageManager', 'yarn')
        }

        await expect(PsychicApp.init(cb, dreamCb)).rejects.toThrow(PsychicAppInitMissingApiRoot)
      })
    })

    context('routes not set', () => {
      it('throws targeted exception', async () => {
        const cb = async (app: PsychicApp) => {
          app.set('apiRoot', 'how/yadoin')
          await app.load('controllers', 'how/yadoin', path => importDefault(path))
          app.set('packageManager', 'yarn')
        }

        await expect(PsychicApp.init(cb, dreamCb)).rejects.toThrow(PsychicAppInitMissingRoutesCallback)
      })
    })

    context('packageManager is not set', () => {
      it('throws targeted exception', async () => {
        const cb = async (app: PsychicApp) => {
          app.set('apiRoot', 'how/yadoin')
          app.set('routes', () => {})
          await app.load('controllers', 'how/yadoin', path => importDefault(path))
        }

        await expect(PsychicApp.init(cb, dreamCb)).rejects.toThrow(PsychicAppInitMissingPackageManager)
      })
    })

    context('packageManager is set to an unrecognized value', () => {
      it('throws targeted exception', async () => {
        const cb = async (app: PsychicApp) => {
          app.set('apiRoot', 'how/yadoin')
          app.set('routes', () => {})
          app.set('packageManager', 'invalid' as 'yarn')
          await app.load('controllers', 'how/yadoin', path => importDefault(path))
        }

        await expect(PsychicApp.init(cb, dreamCb)).rejects.toThrow(PsychicAppInitMissingPackageManager)
      })
    })
  })
})
