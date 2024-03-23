import { ChildProcess } from 'child_process'
import { ssspawn } from '../helpers/sspawn'

export default class FrontEndClientServer {
  private child: ChildProcess
  public async start(port = 3000) {
    this.child = ssspawn(`PORT=${port} yarn client`, { stdio: 'ignore' })
  }

  public async stop() {
    if (!this.child) return
    this.child.kill()
  }
}
