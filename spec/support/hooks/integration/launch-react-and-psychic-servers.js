// intentionally using lower-level spawn here so can kill easily
import kill from 'tree-kill'
import { spawn } from 'child_process'
import sleep from 'src/helpers/sleep'

let _reactServer = global.__psyspec__reactServer = null
let _psychicServer = global.__psyspec__psychicServer = null

jest.setTimeout(30000)

beforeAll(async () => {
  _reactServer = spawn(
    `BROWSER=none PORT=33333 npm run start`,
    [],
    {
      cwd: './tmp/integrationtestapp',
      shell: true,
      stdio: 'inherit',
    }
  )

  _psychicServer = spawn(
    `npm run psy gaze`,
    [],
    {
      shell: true,
      stdio: 'inherit',
      // need to pass env this way for psychic for some reason...
      env: {
        CORE_INTEGRATION_TEST: true,
        PSYCHIC_PORT: 11111,
        PSYCHIC_WSS_PORT: 22222,
        JEST_PUPPETEER_CONFIG: process.env.DRIVER ?
          `.jest-puppeteer.${process.env.DRIVER}.config.js` :
          '.jest-puppeteer.config.js',
      }
    }
  )

  // would love to remove, but need event bindings for when yarn and
  // psychic servers are finished to do that
  await sleep(10000)
})

afterAll(async () => {
  kill(_reactServer.pid)
  kill(_psychicServer.pid)
})
