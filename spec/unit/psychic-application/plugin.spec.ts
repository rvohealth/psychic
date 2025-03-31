import { PsychicApplication } from '../../../src/index.js'
import * as LoadControllersModule from '../../../src/psychic-application/helpers/import/importControllers.js'
import importDefault from '../../../test-app/src/app/helpers/importDefault.js'
import dreamCb from '../../../test-app/src/conf/dream.js'

describe('PsychicApplication#plugin', () => {
  beforeEach(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
    vi.spyOn(LoadControllersModule, 'default').mockResolvedValue({} as any)
  })

  const defaultBehavior = async (app: PsychicApplication) => {
    app.set('packageManager', 'yarn')
    app.set('apiRoot', 'how/yadoin')
    app.set('routes', () => {})
    await app.load('controllers', 'how/yadoin', path => importDefault(path))
  }

  it('applies plugins', async () => {
    let cachedApp: PsychicApplication | undefined = undefined

    await PsychicApplication.init(async app => {
      await defaultBehavior(app)

      app.plugin(_app => {
        cachedApp = _app
      })
    }, dreamCb)

    expect(cachedApp! instanceof PsychicApplication).toBe(true)
  })
})
