import { Encrypt } from '../../../../src'
import { BeforeIoAction } from '../../../../src/cable/decorators'
import PsychicIoListener from '../../../../src/cable/io-listener'
import User from '../../models/User'

export default class ApplicationIoListener extends PsychicIoListener {
  protected currentUser: User | null = null

  public get ioListenerPaths() {
    return ['/api/v1/authed-ping-response'] as const
  }

  @BeforeIoAction()
  public async authenticate() {
    const token = this.socket.handshake.auth.token as string
    const userId = Encrypt.decode(token)
    const user = await User.find(userId)
    if (!user) throw new Error('No user found!')

    this.currentUser = user
  }
}
