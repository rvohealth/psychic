// trying to standardize on a single way of importing files based on
// if DREAM_CORE_DEVELOPMENT=1. Currently, we do it several ways, but this
// would be the most stable moving forward, especially if we ever decide to
// build to dist, since directory structures morph in those contexts.
import path from 'path'
import PsychicApplication from '../psychic-application'
import { envBool } from './envValue'

export default function absoluteFilePath(
  filePath: string,
  { purgeTestAppInCoreDevelopment = false }: { purgeTestAppInCoreDevelopment?: boolean } = {},
): string {
  const psychicApp = PsychicApplication.getOrFail()

  let apiRoot = psychicApp.apiRoot

  if (envBool('PSYCHIC_CORE_DEVELOPMENT')) {
    filePath = filePath.replace(/^[/]?test-app/, '')

    if (purgeTestAppInCoreDevelopment) {
      apiRoot = apiRoot.replace(/\/test-app/, '')
    }
  }

  return path.join(apiRoot, filePath.replace(/^\/src/, ''))
}
