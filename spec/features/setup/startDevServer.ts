import { ChildProcessWithoutNullStreams, spawn } from 'child_process'

let serverProcess: ChildProcessWithoutNullStreams

export function startDevServer() {
  console.log('Starting server...')
  serverProcess = spawn('yarn', ['client'], {
    env: {
      ...process.env,
      BROWSER: 'none',
      VITE_PSYCHIC_ENV: 'test',
    },
  })
  // serverProcess.stdout.on('data', data => {
  // console.log(`Server output: ${data}`)
  // })

  serverProcess.on('error', err => {
    throw err
  })

  serverProcess.stdout.on('data', data => {
    console.log(`Server output: ${data}`)
  })

  serverProcess.stderr.on('data', data => {
    console.error(`Server error: ${data}`)
  })

  serverProcess.on('error', err => {
    console.error(`Server process error: ${err as unknown as string}`)
  })

  serverProcess.on('close', code => {
    console.log(`Server process exited with code ${code}`)
  })

  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
  ;(global as any).$server = serverProcess
}

export function stopDevServer() {
  if (serverProcess) {
    console.log('Stopping server...')
    serverProcess.kill('SIGINT')
    console.log('server stopped')
  }
}
