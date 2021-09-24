import { spawn } from 'child_process'

export default function spawnp(...args) {
  return new Promise((accept, reject) => {
    const child = spawn(...args)

    child.on('exit', () => {
      accept()
    })

    // TODO: handle error!
  })
}
