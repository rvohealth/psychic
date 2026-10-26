import { DreamApp } from '@rvoh/dream'
import * as LoadControllersModule from '../../../../src/psychic-app/helpers/import/importControllers.js'
import PsychicApp, { PsychicAppConflictingDreamSetting } from '../../../../src/psychic-app/index.js'
import importDefault from '../../../../test-app/src/app/helpers/importDefault.js'
import dreamCb from '../../../../test-app/src/conf/dream.js'

describe('PsychicApp set("importAliasPrefix", prefix)', () => {
  let config: PsychicApp

  beforeEach(() => {
    config = new PsychicApp()
  })

  context('when neither conf file sets it', () => {
    it('reads through to Dream, which defaults to @', () => {
      expect(DreamApp.getOrFail().importAliasPrefix).toEqual('@')
      expect(config.importAliasPrefix).toEqual('@')
    })
  })

  context('when only conf/app.ts sets it (psy.set)', () => {
    it('forwards the value to the Dream app, so the generators read it', () => {
      config.set('importAliasPrefix', '#')
      expect(DreamApp.getOrFail().importAliasPrefix).toEqual('#')
      expect(config.importAliasPrefix).toEqual('#')
    })

    it('forwards the last value when set more than once in one boot, without throwing', () => {
      config.set('importAliasPrefix', '#')
      config.set('importAliasPrefix', '@')
      expect(DreamApp.getOrFail().importAliasPrefix).toEqual('@')
      expect(config.importAliasPrefix).toEqual('@')
    })
  })

  context('when only conf/dream.ts sets it (dreamApp.set)', () => {
    it('reads through to the Dream value; Psychic holds no value of its own', () => {
      DreamApp.getOrFail().set('importAliasPrefix', '#')
      expect(config.importAliasPrefix).toEqual('#')
    })
  })

  context('when conf/dream.ts sets it to the same value conf/app.ts sets', () => {
    it('does not throw', () => {
      DreamApp.getOrFail().set('importAliasPrefix', '#')
      expect(() => config.set('importAliasPrefix', '#')).not.toThrow()
      expect(DreamApp.getOrFail().importAliasPrefix).toEqual('#')
    })
  })

  context('when conf/dream.ts sets it to a different value than conf/app.ts', () => {
    it('throws an error naming the setting, both values and both conf files', () => {
      DreamApp.getOrFail().set('importAliasPrefix', '#')

      expect(() => config.set('importAliasPrefix', '@')).toThrow(PsychicAppConflictingDreamSetting)
      expect(() => config.set('importAliasPrefix', '@')).toThrow(/importAliasPrefix/)
      expect(() => config.set('importAliasPrefix', '@')).toThrow(/conf\/dream\.ts.*'#'/)
      expect(() => config.set('importAliasPrefix', '@')).toThrow(/conf\/app\.ts.*'@'/)
    })

    it('throws at boot, from PsychicApp.init', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
      vi.spyOn(LoadControllersModule, 'default').mockResolvedValue({} as any)

      const cb = async (app: PsychicApp) => {
        app.set('apiRoot', 'how/yadoin')
        app.set('routes', () => {})
        app.set('packageManager', 'yarn')
        app.set('importAliasPrefix', '@')
        await app.load('controllers', 'how/yadoin', path => importDefault(path))
      }

      const conflictingDreamCb = async (app: DreamApp) => {
        await dreamCb(app)
        app.set('importAliasPrefix', '#')
      }

      await expect(PsychicApp.init(cb, conflictingDreamCb)).rejects.toThrow(PsychicAppConflictingDreamSetting)
    })
  })
})
