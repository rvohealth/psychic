import PsychicAppInitMissingApiRoot from '../../../src/error/psychic-app/init-missing-api-root.js'
import PsychicAppInitMissingCallToLoadControllers from '../../../src/error/psychic-app/init-missing-call-to-load-controllers.js'
import PsychicAppInitMissingRoutesCallback from '../../../src/error/psychic-app/init-missing-routes-callback.js'
import OpenapiAppRenderer from '../../../src/openapi-renderer/app.js'
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

  context('when generating an openapi document throws', () => {
    async function initAndCatch(): Promise<Error> {
      let thrownError: Error | undefined
      try {
        await initializePsychicApp()
      } catch (err) {
        thrownError = err as Error
      }

      expect(thrownError).toBeInstanceOf(Error)
      return thrownError!
    }

    it('wraps the error with the failing openapiName and the PsychicApp.init step, embedding the original message and preserving the original error as cause', async () => {
      const originalError = new Error('serializer misconfiguration')
      vi.spyOn(OpenapiAppRenderer, '_toObject').mockImplementation(() => {
        throw originalError
      })

      // blow away the openapi cache, so that re-running
      // initializePsychicApp reaches the generation path
      // (cacheOpenapiDoc early-returns for already-cached names)
      _testOnlyClearOpenapiCache('default')

      const thrownError = await initAndCatch()

      expect(thrownError.message).toContain(
        "Failed to generate the OpenAPI document 'default' during PsychicApp.init.",
      )
      expect(thrownError.message).toContain('serializer misconfiguration')
      expect(thrownError.cause).toBe(originalError)
    })

    it('names the specific failing document, not just the first registered one', async () => {
      // populate the openapi cache for every registered openapiName,
      // then clear only 'admin', so it is the only document regenerated
      // (cacheOpenapiDoc early-returns for already-cached names)
      await initializePsychicApp()

      vi.spyOn(OpenapiAppRenderer, '_toObject').mockImplementation(() => {
        throw new Error('boom')
      })
      _testOnlyClearOpenapiCache('admin')

      const thrownError = await initAndCatch()

      expect(thrownError.message).toContain(
        "Failed to generate the OpenAPI document 'admin' during PsychicApp.init.",
      )
    })

    context('when the thrown value is not an Error instance', () => {
      it('embeds a stringified representation of a thrown string, preserving it as cause', async () => {
        await initializePsychicApp()

        vi.spyOn(OpenapiAppRenderer, '_toObject').mockImplementation(() => {
          // eslint-disable-next-line @typescript-eslint/only-throw-error
          throw 'string boom'
        })
        _testOnlyClearOpenapiCache('default')

        const thrownError = await initAndCatch()

        expect(thrownError.message).toContain(
          "Failed to generate the OpenAPI document 'default' during PsychicApp.init.",
        )
        expect(thrownError.message).toContain('string boom')
        expect(thrownError.cause).toBe('string boom')
      })

      it('wraps a thrown null without crashing the catch block, preserving it as cause', async () => {
        await initializePsychicApp()

        vi.spyOn(OpenapiAppRenderer, '_toObject').mockImplementation(() => {
          // eslint-disable-next-line @typescript-eslint/only-throw-error
          throw null
        })
        _testOnlyClearOpenapiCache('default')

        const thrownError = await initAndCatch()

        expect(thrownError.message).toContain(
          "Failed to generate the OpenAPI document 'default' during PsychicApp.init.",
        )
        expect(thrownError.cause).toBeNull()
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
  })
})
