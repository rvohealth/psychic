import * as path from 'path'
import PsychicApplication from '../../psychic-application/index.js.js'

export default function (relDirPath: string, partialFilePath: string) {
  const psychicApp = PsychicApplication.getOrFail()
  const relFilePath = path.join(relDirPath, partialFilePath)
  const absFilePath = path.join(psychicApp.apiRoot, relFilePath)
  const absDirPath = absFilePath.replace(/\/[^/]+$/, '')

  return {
    relFilePath,
    absDirPath,
    absFilePath,
  }
}
