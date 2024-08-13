import fs from 'fs/promises'
import { getCachedPsychicApplicationOrFail } from '../../src/psychic-application/cache'
import path from 'path'

export default async function readTmpFile() {
  const psychicApp = getCachedPsychicApplicationOrFail()
  return (await fs.readFile(path.join(psychicApp.appRoot, '../spec/tmp.txt'))).toString()
}
