import rootPath from '../../config/helpers/rootPath'

export default function logPath() {
  if (process.env.PSYCHIC_CORE_DEVELOPMENT === '1') return rootPath() + `/logs/log.${process.env.NODE_ENV}`

  return rootPath() + `/../logs/log.${process.env.NODE_ENV}`
}
