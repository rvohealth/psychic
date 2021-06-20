import psychic, { Dream } from 'psychic'

export default class User extends Dream {
  initialize() {
    this.authenticates('email', 'password')
  }

  async sendTestEmail() {
    psychic.message('default', {
      to: 'techiemonsta@gmail.com',
      from: 'techiemonsta@gmail.com',
      subject: 'subjeeect',
      text: 'teeeeext',
    })
  }
}
