import ApplicationIoListener from '../../ApplicationIoListener'

export default class UsersIoListener extends ApplicationIoListener {
  public async authedPing<I extends UsersIoListener>(this: I) {
    await this.emit(this.currentUser!, '/api/v1/authed-ping-response', {
      message: 'Successfully pinged authenticated io listener',
    })
  }
}
