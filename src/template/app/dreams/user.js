import { Dream } from 'psychic'

export default class User extends Dream {
  initialize() {
    this.authenticates('email', 'password')
  }
}
