import { describe as context } from '@jest/globals'
import { PsychicApplication } from '../../../src'
import PsychicApplicationInitMissingApiRoot from '../../../src/error/psychic-application/init-missing-api-root'
import PsychicApplicationInitMissingCallToLoadControllers from '../../../src/error/psychic-application/init-missing-call-to-load-controllers'
import PsychicApplicationInitMissingRoutesCallback from '../../../src/error/psychic-application/init-missing-routes-callback'
import * as LoadControllersModule from '../../../src/psychic-application/helpers/loadControllers'
import dreamCb from '../../../test-app/src/conf/dream'

describe('DreamApplication#init', () => {
  beforeEach(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
    jest.spyOn(LoadControllersModule, 'default').mockResolvedValue({} as any)
  })

  context('with a valid config', () => {
    it('does not raise an exception', async () => {
      const cb = async (app: PsychicApplication) => {
        app.set('apiRoot', 'how/yadoin')
        app.set('routes', () => {})
        await app.load('controllers', 'how/yadoin')
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
        }

        await expect(PsychicApplication.init(cb, dreamCb)).rejects.toThrow(
          PsychicApplicationInitMissingCallToLoadControllers,
        )
      })
    })

    context('apiRoot not set', () => {
      it('throws targeted exception', async () => {
        const cb = async (app: PsychicApplication) => {
          await app.load('controllers', 'how/yadoin')
          app.set('routes', () => {})
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
          await app.load('controllers', 'how/yadoin')
        }

        await expect(PsychicApplication.init(cb, dreamCb)).rejects.toThrow(
          PsychicApplicationInitMissingRoutesCallback,
        )
      })
    })
  })
})
