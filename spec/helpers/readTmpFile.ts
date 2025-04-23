import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import PsychicApp from '../../src/psychic-app/index.js'

export default async function readTmpFile() {
  const psychicApp = PsychicApp.getOrFail()
  return (await fs.readFile(path.join(psychicApp.apiRoot, 'spec', 'tmp.txt'))).toString()
}
