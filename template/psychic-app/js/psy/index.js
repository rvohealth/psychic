import common from 'psy/net/common'
import _withForm from 'psy/components/form'

class Psychic {
  on(path, cb) {
    common.on(path, cb)
  }

  withForm(cb) {
    return _withForm(cb)
  }
}

const psychic = global.__psychic_globals_psychic_instance =
  global.__psychic_globals_psychic_instance ||
  new Psychic()

export default psychic
export const withForm = _withForm
