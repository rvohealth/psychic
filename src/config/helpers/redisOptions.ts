import rootPath from './rootPath'

export default async function redisOptions() {
  const redisConf = (await import(rootPath() + '/conf/redis')).default
  return redisConf
}
