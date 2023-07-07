// trying to standardize on a single way of importing files based on
// if DREAM_CORE_DEVELOPMENT=1. Currently, we do it several ways, but this
// would be the most stable moving forward, especially if we ever decide to
// build to dist, since directory structures morph in those contexts.
import path from 'path'

export default function absoluteSrcPath(filePath: string) {
  const absPath =
    process.env.PSYCHIC_CORE_DEVELOPMENT === '1'
      ? path.join(process.cwd(), 'test-app', filePath)
      : process.env.EXECUTED_ON_BEHALF_OF_CONSUMING_APP_BY_CLI === '1'
      ? path.join(process.cwd(), '..', '..', 'src', filePath)
      : path.join(process.cwd(), 'src', filePath)

  const slash = path.sep
  return absPath.replace(`${slash}api${slash}src${slash}src${slash}`, `${slash}api${slash}src${slash}`)
}
