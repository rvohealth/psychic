import { Channel } from 'psychic'
import BlackCat from 'app/dreams/black-cat'

export default class BlackCats extends Channel {
  async index() {
    const blackCat = await BlackCat.first()
    await blackCat.testEmitting()

    this.json({ fish: 10 })
  }

  async show() {
    this.json({ black_cat: await BlackCat.first() })
  }

  async hamburgers() {
    this.json({ ham: 10 })
  }
}
