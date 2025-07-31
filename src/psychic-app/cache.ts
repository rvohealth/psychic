import MustCallPsychicAppInitFirst from '../error/psychic-app/must-call-psychic-app-init-first.js'
import PsychicApp from './index.js'

let _psychicApp: PsychicApp | undefined = undefined

export function cachePsychicApp(psychicApp: PsychicApp) {
  _psychicApp = psychicApp
}

export function getCachedPsychicApp() {
  return _psychicApp
}

export function getCachedPsychicAppOrFail() {
  if (!_psychicApp) throw new MustCallPsychicAppInitFirst()
  return _psychicApp
}
