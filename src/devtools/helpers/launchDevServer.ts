import { ChildProcessWithoutNullStreams, spawn } from 'child_process'
import { debuglog } from 'node:util'
import UnexpectedUndefined from '../../error/UnexpectedUndefined.js'
import PsychicApp from '../../psychic-app/index.js'
import sleep from './sleep.js'

const devServerProcesses: Record<string, ChildProcessWithoutNullStreams | undefined> = {}
const debugEnabled = debuglog('psychic').enabled

export async function launchDevServer(
  key: string,
  { port = 3000, cmd = 'pnpm client', timeout = 20000, onStdOut }: LaunchDevServerOpts = {},
) {
  if (devServerProcesses[key]) return

  if (debugEnabled) PsychicApp.log('Starting server...')
  const [_cmd, ...args] = cmd.split(' ')
  if (_cmd === undefined) throw new UnexpectedUndefined()

  const proc = spawn(_cmd, args, {
    detached: true,
    env: {
      ...process.env,
    },
  })

  // NOTE: adding this stdout spy so that
  // when this cli utility runs node commands,
  // it can properly hijack the stdout from the command
  proc.stdout?.on('data', chunk => {
    const txt = (chunk as number)?.toString()?.trim()
    if (typeof txt !== 'string' || !txt) return

    if (onStdOut) {
      onStdOut(txt)
    } else {
      console.log(txt)
    }
  })

  proc.stderr?.on('data', data => {
    if (debugEnabled) PsychicApp.logWithLevel('error', `Server error: ${data}`)
  })

  proc.on('error', err => {
    PsychicApp.logWithLevel('error', `Server process error: ${err as unknown as string}`)
  })

  proc.on('close', code => {
    if (debugEnabled) PsychicApp.log(`Server process exited with code ${code}`)
  })

  devServerProcesses[key] = proc

  await waitForHttpServer(proc, key, port, timeout)
}

export function stopDevServer(key: string) {
  const proc = devServerProcesses[key]
  if (!proc) {
    throw new Error(`Cannot find a dev server by the key: ${key}`)
  }

  if (proc?.pid) {
    if (debugEnabled) PsychicApp.log('Stopping server...')
    try {
      // proc.kill('SIGINT')
      process.kill(-proc.pid, 'SIGKILL')
    } catch {
      // noop
    }

    delete devServerProcesses[key]

    if (debugEnabled) PsychicApp.log('server stopped')
  }
}

export function stopDevServers() {
  Object.keys(devServerProcesses).forEach(key => {
    stopDevServer(key)
  })
}

async function waitForHttpServer(
  proc: ChildProcessWithoutNullStreams,
  key: string,
  port: number,
  timeout: number = 20000,
) {
  const startTime = Date.now()

  while (Date.now() - startTime < timeout) {
    if (proc.exitCode != null) {
      delete devServerProcesses[key]
      throw new Error(`dev server exited with code ${proc.exitCode} before becoming ready on port ${port}`)
    }

    try {
      const response = await fetch(`http://127.0.0.1:${port}`, { redirect: 'manual' })
      if (response.status > 0) return
    } catch {
      // server not ready yet, keep waiting
    }

    await sleep(100)
  }

  stopDevServer(key)
  throw new Error(`waited too long for dev server on port ${port}`)
}

export interface LaunchDevServerOpts {
  port?: number
  cmd?: string
  timeout?: number
  onStdOut?: (message: string) => void
}
