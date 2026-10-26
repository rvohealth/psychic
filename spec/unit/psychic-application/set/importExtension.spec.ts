import { DreamApp } from '@rvoh/dream'
import * as LoadControllersModule from '../../../../src/psychic-app/helpers/import/importControllers.js'
import PsychicApp, { PsychicAppConflictingDreamSetting } from '../../../../src/psychic-app/index.js'
import importDefault from '../../../../test-app/src/app/helpers/importDefault.js'
import dreamCb from '../../../../test-app/src/conf/dream.js'

describe('PsychicApp set("importExtension", style)', () => {
  let config: PsychicApp

  beforeEach(() => {
    config = new PsychicApp()
  })

  context('when neither conf file sets it', () => {
    it('reads through to Dream, which defaults to .js', () => {
      expect(DreamApp.getOrFail().importExtension).toEqual('.js')
      expect(config.importExtension).toEqual('.js')
    })
  })

  context('when only conf/app.ts sets it (psy.set)', () => {
    it('forwards the value to the Dream app, so the generators read it', () => {
      config.set('importExtension', 'none')
      expect(DreamApp.getOrFail().importExtension).toEqual('none')
      expect(config.importExtension).toEqual('none')
    })

    it('forwards the last value when set more than once in one boot, without throwing', () => {
      config.set('importExtension', 'none')
      config.set('importExtension', '.ts')
      expect(DreamApp.getOrFail().importExtension).toEqual('.ts')
      expect(config.importExtension).toEqual('.ts')
    })
  })

  context('when only conf/dream.ts sets it (dreamApp.set)', () => {
    it('reads through to the Dream value; Psychic holds no value of its own', () => {
      DreamApp.getOrFail().set('importExtension', 'none')
      expect(config.importExtension).toEqual('none')
    })
  })

  context('when conf/dream.ts sets it to the same value conf/app.ts sets', () => {
    it('does not throw', () => {
      DreamApp.getOrFail().set('importExtension', 'none')
      expect(() => config.set('importExtension', 'none')).not.toThrow()
      expect(DreamApp.getOrFail().importExtension).toEqual('none')
    })
  })

  context('when conf/dream.ts sets it to a different value than conf/app.ts', () => {
    it('throws an error naming the setting, both values and both conf files', () => {
      DreamApp.getOrFail().set('importExtension', 'none')

      expect(() => config.set('importExtension', '.ts')).toThrow(PsychicAppConflictingDreamSetting)
      expect(() => config.set('importExtension', '.ts')).toThrow(/importExtension/)
      expect(() => config.set('importExtension', '.ts')).toThrow(/conf\/dream\.ts.*'none'/)
      expect(() => config.set('importExtension', '.ts')).toThrow(/conf\/app\.ts.*'\.ts'/)
    })

    it('throws at boot, from PsychicApp.init', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
      vi.spyOn(LoadControllersModule, 'default').mockResolvedValue({} as any)

      const cb = async (app: PsychicApp) => {
        app.set('apiRoot', 'how/yadoin')
        app.set('routes', () => {})
        app.set('packageManager', 'yarn')
        app.set('importExtension', '.js')
        await app.load('controllers', 'how/yadoin', path => importDefault(path))
      }

      const conflictingDreamCb = async (app: DreamApp) => {
        await dreamCb(app)
        app.set('importExtension', 'none')
      }

      await expect(PsychicApp.init(cb, conflictingDreamCb)).rejects.toThrow(PsychicAppConflictingDreamSetting)
    })
  })
})
