// trying to standardize on a single way of importing files based on
// if DREAM_CORE_DEVELOPMENT=1. Currently, we do it several ways, but this
// would be the most stable moving forward, especially if we ever decide to
// build to dist, since directory structures morph in those contexts.
import { compact } from 'dream'
import path from 'path'

export default function absoluteSrcPath(filePath: string) {
  const distOrNull =
    process.env.PSYCHIC_OMIT_DIST_FOLDER === '1' || process.env.TS_SAFE === '1' ? null : 'dist'

  const absPath =
    process.env.PSYCHIC_CORE_DEVELOPMENT === '1'
      ? path.join(...compact([process.cwd(), distOrNull, 'test-app', filePath.replace('test-app/', '')]))
      : process.env.EXECUTED_ON_BEHALF_OF_CONSUMING_APP_BY_CLI === '1'
      ? path.join(
          ...compact([process.cwd(), '..', '..', distOrNull, 'src', removeDistAndSrcFromFilepath(filePath)])
        )
      : path.join(...compact([process.cwd(), distOrNull, 'src', removeDistAndSrcFromFilepath(filePath)]))

  const slash = path.sep
  return absPath
    .replace(`${slash}api${slash}src${slash}src${slash}`, `${slash}api${slash}src${slash}`)
    .replace(
      `${slash}api${slash}dist${slash}src${slash}src${slash}`,
      `${slash}api${slash}dist${slash}src${slash}`
    )
}

function removeDistAndSrcFromFilepath(filepath: string) {
  return filepath.replace(/^dist\//, '').replace(/^src\//, '')
}
