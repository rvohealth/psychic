import * as fs from 'fs/promises'
import * as path from 'path'
import PsychicApplication from '../../src/psychic-application/index.js'

export default async function rmTmpFile() {
  try {
    const psychicApp = PsychicApplication.getOrFail()
    return await fs.rm(path.join(psychicApp.apiRoot, 'spec/tmp.txt'))
  } catch {
    //
  }
}
