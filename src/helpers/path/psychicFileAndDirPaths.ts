import path from 'path'
import { getCachedPsychicApplicationOrFail } from '../../psychic-application/cache'

export default function (relDirPath: string, partialFilePath: string) {
  const psychicApp = getCachedPsychicApplicationOrFail()
  const relFilePath = path.join(relDirPath, partialFilePath)
  const absFilePath = path.join(psychicApp.apiRoot, relFilePath)
  const absDirPath = absFilePath.replace(/\/[^/]+$/, '')

  return {
    relFilePath,
    absDirPath,
    absFilePath,
  }
}
