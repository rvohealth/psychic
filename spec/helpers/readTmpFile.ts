import * as fs from 'fs/promises'
import * as path from 'path'
import PsychicApplication from '../../src/psychic-application.js'

export default async function readTmpFile() {
  const psychicApp = PsychicApplication.getOrFail()
  return (await fs.readFile(path.join(psychicApp.apiRoot, 'spec/tmp.txt'))).toString()
}
