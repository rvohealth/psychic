import common from 'psy/net/common'

class Psychic {
  on(path, cb) {
    common.on(path, cb)
  }
}

const psychic = global.__psychic_globals_psychic_instance =
  global.__psychic_globals_psychic_instance ||
  new Psychic()

export default psychic
