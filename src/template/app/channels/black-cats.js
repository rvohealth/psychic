import { Channel } from 'psychic'
import BlackCat from 'app/dreams/black-cat'

export default class BlackCats extends Channel {
  async index() {
    this.json(await BlackCat.all())
  }

  async show() {
    this.json({ black_cat: await BlackCat.first() })
  }
}
