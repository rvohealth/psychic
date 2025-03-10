import * as fs from 'fs/promises'
import * as path from 'path'
import PsychicApplication from '../../src/psychic-application'

export default async function writeTmpFile(content: string) {
  const psychicApp = PsychicApplication.getOrFail()
  return await fs.writeFile(path.join(psychicApp.apiRoot, 'spec/tmp.txt'), content)
}
