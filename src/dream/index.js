import Psyclass from 'src/psychic/psyclass'
import AuthenticationProvider from 'src/dream/concerns/authentication'
import HooksProvider from 'src/dream/concerns/hooks'
import QueryProvider from 'src/dream/concerns/query'
import AssociationsProvider from 'src/dream/concerns/associations'
import AttributesProvider from 'src/dream/concerns/attributes'
import ActiveModelProvider from 'src/dream/concerns/active-model'
import WSProvider from 'src/dream/concerns/ws'
import ValidationsProvider from 'src/dream/concerns/validations'

import mix from 'src/helpers/mix'

class Dream extends mix(Psyclass).with(
  ActiveModelProvider,
  AttributesProvider,
  QueryProvider,
  AssociationsProvider,
  AuthenticationProvider,
  HooksProvider,
  WSProvider,
  ValidationsProvider,
) {
  constructor(attributes={}) {
    super(attributes)

    this.initialize()
  }

  // deprecate
  static get isDream() {
    return true
  }

  // deprecate
  get isDream() {
    return this.constructor.isDream
  }

  // deprecate
  get isDreamInstance() {
    return true
  }

  initialize() {
    // define in child class
  }
}

export default Dream
