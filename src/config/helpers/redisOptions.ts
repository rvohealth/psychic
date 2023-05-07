import absoluteSrcPath from '../../helpers/absoluteSrcPath'

export default async function redisOptions() {
  const redisConf = (await import(absoluteSrcPath('/conf/redis'))).default
  return redisConf
}
