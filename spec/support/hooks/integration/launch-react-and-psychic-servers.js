// intentionally using lower-level spawn here so can kill easily
import kill from 'tree-kill'
import { spawn } from 'child_process'
import sleep from 'src/helpers/sleep'

let _reactServer = global.__psyspec__reactServer = null
let _psychicServer = global.__psyspec__psychicServer = null

jest.setTimeout(30000)

beforeAll(async () => {
  _reactServer = spawn(
    `cd ./tmp/integrationtestapp && \
      BROWSER=none yarn run start`,
    [],
    { shell: true, stdio: 'inherit' }
  )
  // _psychicServer = spawn('cd ./tmp/integrationtestapp && PSYCHIC_PORT=111 PSYCHIC_WSS_PORT=222 yarn run psy gaze', [], { shell: true, stdio: 'inherit' })
  await sleep(20000)
})

afterAll(async () => {
  // kill(_reactServer.pid)
  // kill(_psychicServer.pid)
})
