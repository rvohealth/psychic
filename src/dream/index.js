import Psyclass from 'src/psychic/psyclass'
import ActiveModelProvider from 'src/dream/concerns/active-model'
import AssociationsProvider from 'src/dream/concerns/associations'
import AttributesProvider from 'src/dream/concerns/attributes'
import AuthenticationProvider from 'src/dream/concerns/authentication'
import HooksProvider from 'src/dream/concerns/hooks'
import IsDream from 'src/dream/concerns/is-dream'
import QueryProvider from 'src/dream/concerns/query'
import ValidationsProvider from 'src/dream/concerns/validations'
import WSProvider from 'src/dream/concerns/ws'

import mix from 'src/helpers/mix'

class Dream extends mix(Psyclass).with(
  ActiveModelProvider,
  AssociationsProvider,
  AttributesProvider,
  AuthenticationProvider,
  HooksProvider,
  IsDream,
  QueryProvider,
  ValidationsProvider,
  WSProvider,
) {
  constructor(attributes={}) {
    super(attributes)

    this.initialize()
  }

  // define in child class
  initialize() {}
}

export default Dream
