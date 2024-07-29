import path from 'path'
import envValue from './envValue'
import { getCachedPsyconfOrFail } from '../psyconf/cache'

export default function openapiJsonPath() {
  const psyconf = getCachedPsyconfOrFail()
  return path.join(envValue('APP_ROOT_PATH'), psyconf.openapi?.outputFilename || 'openapi.json')
}
