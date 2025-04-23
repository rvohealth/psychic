import PsychicApp from './index.js'

let _psychicApp: PsychicApp | undefined = undefined

export function cachePsychicApp(psychicApp: PsychicApp) {
  _psychicApp = psychicApp
}

export function getCachedPsychicApp() {
  return _psychicApp
}

export function getCachedPsychicAppOrFail() {
  if (!_psychicApp) throw new Error('must call `cachePsychicApp` before loading cached psychic app')
  return _psychicApp
}
