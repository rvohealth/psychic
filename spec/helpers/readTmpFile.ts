import fs from 'fs/promises'
import path from 'path'
import { getCachedPsychicApplicationOrFail } from '../../src/psychic-application/cache'

export default async function readTmpFile() {
  const psychicApp = getCachedPsychicApplicationOrFail()
  return (await fs.readFile(path.join(psychicApp.apiRoot, 'spec/tmp.txt'))).toString()
}
