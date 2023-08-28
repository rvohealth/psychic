// trying to standardize on a single way of importing files based on
// if DREAM_CORE_DEVELOPMENT=1. Currently, we do it several ways, but this
// would be the most stable moving forward, especially if we ever decide to
// build to dist, since directory structures morph in those contexts.
import path from 'path'

export default function absoluteFilePath(filePath: string) {
  if (!process.env.APP_ROOT_PATH)
    throw `
      [Psychic]: Must set APP_ROOT_PATH before using psychic
    `
  return path.join(process.env.APP_ROOT_PATH!, filePath)
}
