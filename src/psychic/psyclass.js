import include from 'src/helpers/include'

class Psyclass {
  static new(...args) {
    return new this(...args)
  }

  static include(...mixins) {
    include(this, ...mixins)
  }

  include(...mixins) {
    include(this, ...mixins)
  }
}

export default Psyclass
