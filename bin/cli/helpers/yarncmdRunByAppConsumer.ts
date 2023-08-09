import { coreSuffix } from './setCoreDevelopmentFlag'
import yarnCwd from './yarmCwd'

export default function yarncmdRunByAppConsumer(command: string, programArgs: string[]) {
  const coreSuffixFlag = coreSuffix(programArgs)
  const nodeEnvPrefix = process.env.NODE_ENV ? `NODE_ENV=${process.env.NODE_ENV} ` : ''
  return `${nodeEnvPrefix}yarn ${yarnCwd(programArgs)}${command}${coreSuffixFlag}`
}
