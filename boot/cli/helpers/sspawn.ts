import { spawn } from 'child_process'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function sspawn(command: string, opts: any = {}) {
  return new Promise((accept, reject) => {
    ssspawn(command, opts).on('close', code => {
      if (code !== 0) reject(code)
      accept({})
    })
  })
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function ssspawn(command: string, opts: any = {}) {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  return spawn(command, {
    stdio: 'inherit',
    shell: true,
    ...opts,
  })
}
