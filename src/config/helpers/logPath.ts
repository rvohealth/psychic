import absoluteFilePath from '../../helpers/absoluteFilePath'

export default function logPath() {
  return absoluteFilePath(`logs/log.${process.env.NODE_ENV}`)
}
