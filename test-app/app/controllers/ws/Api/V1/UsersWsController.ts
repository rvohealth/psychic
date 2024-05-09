import appWs from '../../../../services/AppWs'
import ApplicationWsController from '../../ApplicationWsController'

export default class UsersWsController extends ApplicationWsController {
  public async authedPing<I extends UsersWsController>(this: I) {
    await appWs.emit(this.currentUser!, '/api/v1/authed-ping-response', {
      message: 'Successfully pinged authenticated io listener',
    })
  }
}
