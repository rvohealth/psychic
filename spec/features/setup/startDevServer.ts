import { ChildProcessWithoutNullStreams, spawn } from 'child_process'
import sleep from '../../helpers/sleep'

let serverProcess: ChildProcessWithoutNullStreams | undefined = undefined

export async function startDevServer() {
  if (process.env.DEBUG === '1') console.log('Starting server...')
  serverProcess = spawn('yarn', ['client'], {
    detached: true,
    env: {
      ...process.env,
      BROWSER: 'none',
      VITE_PSYCHIC_ENV: 'test',
    },
  })

  // TODO: add polling to ensure port is ready
  await sleep(3000)

  serverProcess.stdout.on('data', data => {
    if (process.env.DEBUG === '1') console.log(`Server output: ${data}`)
  })

  serverProcess.on('error', err => {
    throw err
  })

  serverProcess.stdout.on('data', data => {
    if (process.env.DEBUG === '1') console.log(`Server output: ${data}`)
  })

  serverProcess.stderr.on('data', data => {
    if (process.env.DEBUG === '1') console.error(`Server error: ${data}`)
  })

  serverProcess.on('error', err => {
    console.error(`Server process error: ${err as unknown as string}`)
  })

  serverProcess.on('close', code => {
    if (process.env.DEBUG === '1') console.log(`Server process exited with code ${code}`)
  })
}

export function stopDevServer() {
  if (serverProcess?.pid) {
    if (process.env.DEBUG === '1') console.log('Stopping server...')
    // serverProcess.kill('SIGINT')
    process.kill(-serverProcess.pid, 'SIGKILL')
    serverProcess = undefined

    if (process.env.DEBUG === '1') console.log('server stopped')
  }
}
