import fs from 'fs/promises'
import path from 'path'
import { getCachedPsychicApplicationOrFail } from '../../src/psychic-application/cache'

export default async function readTmpFile() {
  try {
    const psychicApp = getCachedPsychicApplicationOrFail()
    return await fs.rm(path.join(psychicApp.apiRoot, 'spec/tmp.txt'))
  } catch (err) {
    //
  }
}
