import path from 'path'
import envValue from './envValue'

export default function openapiJsonPath() {
  return path.join(envValue('APP_ROOT_PATH'), 'openapi.json')
}
