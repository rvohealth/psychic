import { PsychicCliBgColor, PsychicCliForegroundColor } from '../../cli/helpers/colorize.js'
import { HttpMethod } from '../../router/types.js'

export default function httpMethodColor(httpMethod: HttpMethod): PsychicCliForegroundColor {
  switch (httpMethod) {
    case 'delete':
      return 'red'
    case 'options':
      return 'gray'
    case 'patch':
    case 'put':
      return 'magentaBright'
    case 'post':
      return 'greenBright'

    default:
      return 'blue'
  }
}

export function httpMethodBgColor(httpMethod: HttpMethod): PsychicCliBgColor {
  switch (httpMethod) {
    case 'delete':
      return 'bgRed'
    case 'options':
      return 'bgWhite'
    case 'patch':
    case 'put':
      return 'bgMagentaBright'
    case 'post':
      return 'bgGreen'

    default:
      return 'bgBlue'
  }
}
