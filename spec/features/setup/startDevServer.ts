import { ChildProcessWithoutNullStreams, spawn } from 'child_process'
import sleep from '../../helpers/sleep'

let serverProcess: ChildProcessWithoutNullStreams

export async function startDevServer() {
  if (process.env.DEBUG === '1') console.log('Starting server...')
  serverProcess = spawn('yarn', ['client'], {
    env: {
      ...process.env,
      BROWSER: 'none',
      VITE_PSYCHIC_ENV: 'test',
    },
  })
  await sleep(4000)

  // TODO: add polling to ensure port is ready

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

  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
  ;(global as any).$server = serverProcess
}

export function stopDevServer() {
  if (serverProcess) {
    if (process.env.DEBUG === '1') console.log('Stopping server...')
    serverProcess.kill('SIGINT')
    if (process.env.DEBUG === '1') console.log('server stopped')
  }
}
