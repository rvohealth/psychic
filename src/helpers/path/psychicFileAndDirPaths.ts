import * as path from 'node:path'
import PsychicApp from '../../psychic-app/index.js'

export default function (relDirPath: string, partialFilePath: string) {
  const psychicApp = PsychicApp.getOrFail()
  const relFilePath = path.join(relDirPath, partialFilePath)
  const absFilePath = path.join(psychicApp.apiRoot, relFilePath)
  const absDirPath = absFilePath.replace(/\/[^/]+$/, '')

  return {
    relFilePath,
    absDirPath,
    absFilePath,
  }
}
