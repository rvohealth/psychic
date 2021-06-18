import { Channel } from '../../../../dist'

export default class TestUsersChannel extends Channel {
  create() {
    return this.json({ fish: 10 })
  }
}
