import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import PsychicApplication from '../../src/psychic-application/index.js'

export default async function writeTmpFile(content: string) {
  const psychicApp = PsychicApplication.getOrFail()
  return await fs.writeFile(path.join(psychicApp.apiRoot, 'spec', 'tmp.txt'), content)
}
