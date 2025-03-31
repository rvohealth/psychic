import { spawn, SpawnOptions } from 'child_process'

export default function sspawn(
  command: string,
  opts: SpawnOptions & { onStdout?: (str: string) => void } = {},
) {
  return new Promise((accept, reject) => {
    ssspawn(command, opts).on('close', code => {
      if (code !== 0) reject(code)
      accept({})
    })
  })
}

export function ssspawn(command: string, opts: SpawnOptions & { onStdout?: (str: string) => void } = {}) {
  const proc = spawn(command, {
    // even though github security scans want to remove this,
    // it is necessary to allow the cli util to run as the current
    // user. This is only done to provision a new psychic application,
    // so it is safe from unknown execution contexts.
    shell: true,

    ...opts,
  })

  // NOTE: adding this stdout spy so that
  // when this cli utility runs node commands,
  // it can properly hijack the stdout from the command
  proc.stdout?.on('data', (chunk: Buffer) => {
    const txt = chunk?.toString()?.trim()
    if (typeof txt !== 'string' || !txt) return

    if (opts?.onStdout) {
      opts?.onStdout?.(txt)
    } else {
      console.log(txt)
    }
  })

  proc.stdout?.on('error', err => {
    console.log('sspawn error!')
    console.error(err)
  })

  proc.on('error', err => {
    console.log('sspawn error!')
    console.error(err)
  })

  return proc
}
