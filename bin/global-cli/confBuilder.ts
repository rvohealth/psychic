export default class ConfBuilder {
  public static buildAll({
    api,
    redis,
    ws,
    uuids,
  }: {
    api: boolean
    redis: boolean
    ws: boolean
    uuids: boolean
  }) {
    const opts: string[] = []
    if (api) opts.push('config.apiOnly = true')
    if (ws) opts.push('config.useWs = true')
    if (redis) opts.push('config.useRedis = true')
    if (uuids) opts.push('config.useUUIDs = true')

    return `\
psychic:
  api_only: ${api ? 'true' : 'false'}
  ws: ${ws ? 'true' : 'false'}
  redis: ${redis ? 'true' : 'false'}
  use_uuids: ${uuids ? 'true' : 'false'}
`
  }
}
