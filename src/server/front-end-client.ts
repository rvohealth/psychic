import { ChildProcess } from 'child_process'
import { ssspawn } from '../helpers/sspawn.js.js'

export default class FrontEndClientServer {
  private child: ChildProcess
  public start(port = 3000) {
    this.child = ssspawn(`PORT=${port} yarn client`, { stdio: 'ignore' })
  }

  public stop() {
    if (!this.child) return
    this.child.kill()
  }
}
