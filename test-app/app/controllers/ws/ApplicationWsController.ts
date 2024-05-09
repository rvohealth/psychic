import { Encrypt } from '../../../../src'
import { BeforeIoAction } from '../../../../src/cable/decorators'
import PsychicWsController from '../../../../src/cable/ws-controller'
import User from '../../models/User'

export default class ApplicationWsController extends PsychicWsController {
  protected currentUser: User | null = null

  @BeforeIoAction()
  public async authenticate() {
    const token = this.socket.handshake.auth.token as string
    const userId = Encrypt.decode(token)
    const user = await User.find(userId)
    if (!user) throw new Error('No user found!')

    this.currentUser = user
  }
}
