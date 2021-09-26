import include from 'src/helpers/include'

class Psyclass {
  static new(...args) {
    return new this(...args)
  }

  static include(...mixins) {
    include(this, ...mixins)
    return this
  }

  include(...mixins) {
    include(this, ...mixins)
    return this
  }
}

export default Psyclass
