import { Channel } from 'psychic'
// import User from 'app/dreams/user'

export default class UsersChannel extends Channel {
  initialize() {
    this.authenticates('user', { against: 'email:password', as: 'currentUser' })
  }

  async create() {
    this.json({ fish: 10 })
  }
}
