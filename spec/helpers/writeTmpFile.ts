import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import PsychicApp from '../../src/psychic-app/index.js'

export default async function writeTmpFile(content: string) {
  const psychicApp = PsychicApp.getOrFail()
  return await fs.writeFile(path.join(psychicApp.apiRoot, 'spec', 'tmp.txt'), content)
}
