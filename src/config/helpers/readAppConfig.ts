import * as fs from 'fs'
import * as YAML from 'yaml'
import absoluteSrcPath from '../../helpers/absoluteSrcPath'

let _appConfig: AppConfig | null = null
export default function readAppConfig() {
  if (_appConfig) return _appConfig

  const appYmlPath = absoluteSrcPath('conf/app.yml')
  const buffer = fs.readFileSync(appYmlPath, 'utf8')
  _appConfig = YAML.parse(buffer)?.psychic || {
    ws: false,
    redis: false,
    api_only: false,
    use_uuids: false,
  }

  return _appConfig
}

export interface AppConfig {
  ws: boolean
  redis: boolean
  api_only: boolean
  use_uuids: boolean
}
