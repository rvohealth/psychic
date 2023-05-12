import absoluteSrcPath from '../../helpers/absoluteSrcPath'
import importFileWithDefault from '../../helpers/importFileWithDefault'

export default async function redisOptions() {
  const redisConf = await importFileWithDefault(absoluteSrcPath('/conf/redis'))
  return redisConf
}
