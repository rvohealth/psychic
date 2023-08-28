// trying to standardize on a single way of importing files based on
// if DREAM_CORE_DEVELOPMENT=1. Currently, we do it several ways, but this
// would be the most stable moving forward, especially if we ever decide to
// build to dist, since directory structures morph in those contexts.
import { compact } from 'dream'
import path from 'path'

export default function absoluteSrcPath(filePath: string) {
  const distOrNull =
    process.env.PSYCHIC_OMIT_DIST_FOLDER === '1' || process.env.TS_SAFE === '1' ? null : 'dist'
  return path.join(...compact([process.env.APP_ROOT_PATH!, distOrNull, 'src', filePath]))
}
