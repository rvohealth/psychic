import absoluteSrcPath from '../../helpers/absoluteSrcPath'
import rootPath from './rootPath'

export default async function redisOptions() {
  const redisConf = (await import(absoluteSrcPath('/conf/redis'))).default
  return redisConf
}
