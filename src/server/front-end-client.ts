import { ChildProcess } from 'child_process'
import { ssspawn } from '../helpers/sspawn.js'
import PsychicApplication from '../psychic-application/index.js'

export default class FrontEndClientServer {
  private child: ChildProcess
  public start(port = 3000) {
    const psychicApp = PsychicApplication.getOrFail()
    this.child = ssspawn(`PORT=${port} ${psychicApp.packageManager} client`, { stdio: 'ignore' })
  }

  public stop() {
    if (!this.child) return
    this.child.kill()
  }
}
