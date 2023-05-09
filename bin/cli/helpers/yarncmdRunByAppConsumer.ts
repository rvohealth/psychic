import { coreSuffix } from './setCoreDevelopmentFlag'
import yarnCwd from './yarmCwd'

export default function yarncmdRunByAppConsumer(command: string, programArgs: string[]) {
  const coreSuffixFlag = coreSuffix(programArgs)
  return `yarn ${yarnCwd(programArgs)}${command}${coreSuffixFlag}`
}
