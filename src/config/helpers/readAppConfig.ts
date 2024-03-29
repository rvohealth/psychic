import PsychicConfig from '..'

let _appConfig: AppConfig | null = null
export default async function readAppConfig() {
  if (_appConfig) return _appConfig

  const psy = await PsychicConfig.bootForReading()

  _appConfig = {
    name: psy.appName,
    ws: psy.useWs,
    redis: psy.useRedis,
    api_only: psy.apiOnly,
  }

  return _appConfig
}

export interface AppConfig {
  name: string
  ws: boolean
  redis: boolean
  api_only: boolean
}
