// trying to standardize on a single way of importing files based on
// if DREAM_CORE_DEVELOPMENT=1. Currently, we do it several ways, but this
// would be the most stable moving forward, especially if we ever decide to
// build to dist, since directory structures morph in those contexts.
import path from 'path'
import { getCachedPsychicApplicationOrFail } from '../psychic-application/cache'
import { envBool } from './envValue'

export default function absoluteFilePath(
  filePath: string,
  { purgeTestAppInCoreDevelopment = false }: { purgeTestAppInCoreDevelopment?: boolean } = {},
): string {
  const psychicApp = getCachedPsychicApplicationOrFail()

  let appRoot = psychicApp.appRoot

  if (envBool('PSYCHIC_CORE_DEVELOPMENT')) {
    filePath = filePath.replace(/^[/]?test-app/, '')

    if (purgeTestAppInCoreDevelopment) {
      appRoot = appRoot.replace(/\/test-app/, '')
    }
  }

  if (!envBool('TS_SAFE')) {
    filePath = path.join('dist', filePath)
  }

  return path.join(appRoot, filePath)
}
