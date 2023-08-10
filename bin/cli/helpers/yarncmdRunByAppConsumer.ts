import { coreSuffix } from './setCoreDevelopmentFlag'
import yarnCwd from './yarmCwd'

export default function yarncmdRunByAppConsumer(command: string, programArgs: string[]) {
  const coreSuffixFlag = coreSuffix(programArgs)
  const nodeEnvPrefix = process.env.NODE_ENV ? `NODE_ENV=${process.env.NODE_ENV} ` : ''
  const cmd = `${nodeEnvPrefix}yarn ${yarnCwd(programArgs)}${command}${coreSuffixFlag}`
  if (process.env.DEBUG === '1') {
    console.log('About to run command: ', cmd)
  }
  return cmd
}
