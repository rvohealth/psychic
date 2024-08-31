import { spawn } from 'child_process'

export default function sspawn(
  command: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  opts: any = {},
) {
  return new Promise((accept, reject) => {
    ssspawn(command, opts).on('close', code => {
      if (code !== 0) reject(new Error(code?.toString()))
      accept({})
    })
  })
}

export function ssspawn(
  command: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  opts: any = {},
) {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  return spawn(command, {
    stdio: 'inherit',
    shell: true,
    ...opts,
  })
}
