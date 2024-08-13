import PsychicApplication from '.'

let _psychicApp: PsychicApplication | undefined = undefined

export function cachePsychicApplication(psychicApp: PsychicApplication) {
  _psychicApp = psychicApp
}

export function getCachedPsychicApplication() {
  return _psychicApp
}

export function getCachedPsychicApplicationOrFail() {
  if (!_psychicApp) throw new Error('must call `cachePsychicApplication` before loading cached psychic app')
  return _psychicApp
}
