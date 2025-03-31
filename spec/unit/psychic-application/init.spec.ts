import PsychicApplicationInitMissingApiRoot from '../../../src/error/psychic-application/init-missing-api-root.js'
import PsychicApplicationInitMissingCallToLoadControllers from '../../../src/error/psychic-application/init-missing-call-to-load-controllers.js'
import PsychicApplicationInitMissingPackageManager from '../../../src/error/psychic-application/init-missing-package-manager.js'
import PsychicApplicationInitMissingRoutesCallback from '../../../src/error/psychic-application/init-missing-routes-callback.js'
import { PsychicApplication } from '../../../src/index.js'
import * as LoadControllersModule from '../../../src/psychic-application/helpers/import/importControllers.js'
import importDefault from '../../../test-app/src/app/helpers/importDefault.js'
import dreamCb from '../../../test-app/src/conf/dream.js'

describe('PsychicApplication#init', () => {
  beforeEach(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
    vi.spyOn(LoadControllersModule, 'default').mockResolvedValue({} as any)
  })

  context('with a valid config', () => {
    it('does not raise an exception', async () => {
      const cb = async (app: PsychicApplication) => {
        app.set('apiRoot', 'how/yadoin')
        app.set('routes', () => {})
        app.set('packageManager', 'yarn')
        await app.load('controllers', 'how/yadoin', path => importDefault(path))
      }

      await expect(PsychicApplication.init(cb, dreamCb)).resolves.not.toThrow()
    })
  })

  context('with an invalid config', () => {
    context('load("controllers") never called', () => {
      it('throws targeted exception', async () => {
        const cb = (app: PsychicApplication) => {
          app.set('apiRoot', 'how/yadoin')
          app.set('routes', () => {})
          app.set('packageManager', 'yarn')
        }

        await expect(PsychicApplication.init(cb, dreamCb)).rejects.toThrow(
          PsychicApplicationInitMissingCallToLoadControllers,
        )
      })
    })

    context('apiRoot not set', () => {
      it('throws targeted exception', async () => {
        const cb = async (app: PsychicApplication) => {
          await app.load('controllers', 'how/yadoin', path => importDefault(path))
          app.set('routes', () => {})
          app.set('packageManager', 'yarn')
        }

        await expect(PsychicApplication.init(cb, dreamCb)).rejects.toThrow(
          PsychicApplicationInitMissingApiRoot,
        )
      })
    })

    context('routes not set', () => {
      it('throws targeted exception', async () => {
        const cb = async (app: PsychicApplication) => {
          app.set('apiRoot', 'how/yadoin')
          await app.load('controllers', 'how/yadoin', path => importDefault(path))
          app.set('packageManager', 'yarn')
        }

        await expect(PsychicApplication.init(cb, dreamCb)).rejects.toThrow(
          PsychicApplicationInitMissingRoutesCallback,
        )
      })
    })

    context('packageManager is not set', () => {
      it('throws targeted exception', async () => {
        const cb = async (app: PsychicApplication) => {
          app.set('apiRoot', 'how/yadoin')
          app.set('routes', () => {})
          await app.load('controllers', 'how/yadoin', path => importDefault(path))
        }

        await expect(PsychicApplication.init(cb, dreamCb)).rejects.toThrow(
          PsychicApplicationInitMissingPackageManager,
        )
      })
    })

    context('packageManager is set to an unrecognized value', () => {
      it('throws targeted exception', async () => {
        const cb = async (app: PsychicApplication) => {
          app.set('apiRoot', 'how/yadoin')
          app.set('routes', () => {})
          app.set('packageManager', 'invalid' as 'yarn')
          await app.load('controllers', 'how/yadoin', path => importDefault(path))
        }

        await expect(PsychicApplication.init(cb, dreamCb)).rejects.toThrow(
          PsychicApplicationInitMissingPackageManager,
        )
      })
    })
  })
})
