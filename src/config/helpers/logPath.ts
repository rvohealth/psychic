import absoluteFilePath from '../../helpers/absoluteFilePath'

export default function logPath() {
  return process.env.PSYCHIC_LOG_PATH || absoluteFilePath(`logs/log.${process.env.NODE_ENV}`)
}
