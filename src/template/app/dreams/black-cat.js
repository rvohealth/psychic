import { Dream } from 'psychic'

export default class BlackCat extends Dream {
  initialize() {
    this
      .belongsTo('user', { foreignKey: 'user_id' })
      .emitsTo('user', { as: 'currentUser' })
  }

  async testEmitting() {
    await this.emit('user', { fish: 10 })
  }
}
