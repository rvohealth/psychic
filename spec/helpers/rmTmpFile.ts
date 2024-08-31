import fs from 'fs/promises'
import path from 'path'
import PsychicApplication from '../../src/psychic-application'

export default async function readTmpFile() {
  try {
    const psychicApp = PsychicApplication.getOrFail()
    return await fs.rm(path.join(psychicApp.apiRoot, 'spec/tmp.txt'))
  } catch {
    //
  }
}
