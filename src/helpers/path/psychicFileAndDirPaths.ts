import path from 'path'
import PsychicApplication from '../../psychic-application'

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
