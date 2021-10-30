import GenerateCLIProgram from 'src/cli/program/generate'
import File from 'src/helpers/file'

const generateCLIProgram = new GenerateCLIProgram()

describe('cli program g:channel <name>', () => {
  const template =
`\
import { Channel } from 'psychic'


export default class FishmanChannel extends Channel {


}
`

  it ('generates a new channel in the channels folder with the passed name', async () => {
    File.write = eavesdrop()
    await generateCLIProgram.run({ command: 'channel', args: ['fishman'] })
    expect(File.write).toHaveBeenCalledWith('app/channels/fishman.js', template)
  })
})

describe ('cli program g:channel users key:gmail password:secret create auth update delete index show', () => {
  it ('uses all passed args to generate templated endpoints', async () => {
    const template =
`\
import { Channel } from 'psychic'
import User from 'app/dreams/user'

export default class UsersChannel extends Channel {
  initialize() {
    this.authenticates('user', { against: 'gmail:secret', as: 'currentUser' })
  }

  create() {
    const user = await User.create(this.paramsFor(User))
    this.json(user)
  }

  update() {
    const user = await User.find(this.params.id)
    await user.update(this.paramsFor(User))
    this.json(user)
  }

  delete() {
    const user = await User.find(this.params.id)
    await user.delete()
    this.json({ id: user.id })
  }

  index() {
    const users = await User.all()
    this.json(users)
  }

  show() {
    const user = await User.find(this.params.id)
    this.json(user)
  }
}
`
    File.write = eavesdrop()
    await generateCLIProgram.run({ command: 'channel', args: [
      'users',
      'key:gmail',
      'password:secret',
      'create',
      'auth',
      'update',
      'delete',
      'index',
      'show',
      ]
    })
    expect(File.write).toHaveBeenCalledWith('app/channels/users.js', template.toString())
  })
})
