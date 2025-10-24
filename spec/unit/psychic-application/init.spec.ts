import PsychicAppInitMissingApiRoot from '../../../src/error/psychic-app/init-missing-api-root.js'
import PsychicAppInitMissingCallToLoadControllers from '../../../src/error/psychic-app/init-missing-call-to-load-controllers.js'
import PsychicAppInitMissingPackageManager from '../../../src/error/psychic-app/init-missing-package-manager.js'
import PsychicAppInitMissingRoutesCallback from '../../../src/error/psychic-app/init-missing-routes-callback.js'
import * as LoadControllersModule from '../../../src/psychic-app/helpers/import/importControllers.js'
import PsychicApp from '../../../src/psychic-app/index.js'
import { _testOnlyClearOpenapiCache } from '../../../src/psychic-app/openapi-cache.js'
import importDefault from '../../../test-app/src/app/helpers/importDefault.js'
import initializePsychicApp from '../../../test-app/src/cli/helpers/initializePsychicApp.js'
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

    context('when an openapi-decorated route is missing', () => {
      // this came up as an actual bug in some of our projects,
      // since we will intentionally only allow some routes in
      // our dev/stage environments.
      it('does not fail to initialize the psychic app', async () => {
        process.env.SKIP_TEST_ROUTE = '1'

        // blow away the openapi cache, so that re-running
        // initializePsychicApp will force the cache to be
        // rebuilt.
        _testOnlyClearOpenapiCache('default')

        await initializePsychicApp()
        process.env.SKIP_TEST_ROUTE = undefined
      })
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

    context('routes callback not provided', () => {
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
