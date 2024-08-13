import fs from 'fs/promises'
import { getCachedPsychicApplicationOrFail } from '../../src/psychic-application/cache'
import path from 'path'

export default async function writeTmpFile(content: string) {
  const psychicApp = getCachedPsychicApplicationOrFail()
  return await fs.writeFile(path.join(psychicApp.appRoot, '../spec/tmp.txt'), content)
}
