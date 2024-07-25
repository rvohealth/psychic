// trying to standardize on a single way of importing files based on
// if DREAM_CORE_DEVELOPMENT=1. Currently, we do it several ways, but this
// would be the most stable moving forward, especially if we ever decide to
// build to dist, since directory structures morph in those contexts.
import { compact } from '@rvohealth/dream'
import path from 'path'
import envValue, { envBool } from './envValue'

export default function absoluteSrcPath(filePath: string) {
  const distOrNull = envBool('PSYCHIC_OMIT_DIST_FOLDER') || envBool('TS_SAFE') ? null : 'dist'
  const srcOrNull = envBool('PSYCHIC_CORE_DEVELOPMENT') ? 'test-app' : 'src'

  return path.join(
    ...compact([
      envValue('APP_ROOT_PATH'),
      envBool('PSYCHIC_CORE_DEVELOPMENT') ? '..' : null,
      distOrNull,
      srcOrNull,
      filePath,
    ]),
  )
}
