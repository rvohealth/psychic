import Psyconf from '.'

let _psyconf: Psyconf | undefined = undefined

export function cachePsyconf(psyconf: Psyconf) {
  _psyconf = psyconf
}

export function getCachedPsyconf() {
  return _psyconf
}

export function getCachedPsyconfOrFail() {
  if (!_psyconf) throw new Error('must call `cachePsyconf` before loading cached psyconf')
  return _psyconf
}
