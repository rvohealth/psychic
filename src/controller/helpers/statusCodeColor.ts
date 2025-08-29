import { PsychicCliBgColor, PsychicCliForegroundColor } from '../../cli/helpers/colorize.js'

export default function statusCodeColor(statusCode: number): PsychicCliForegroundColor {
  if (statusCode >= 200 && statusCode < 300) return 'green'
  if (statusCode >= 300 && statusCode < 400) return 'yellow'
  if (statusCode >= 400 && statusCode < 500) return 'red'
  return 'redBright'
}

export function statusCodeBgColor(statusCode: number): PsychicCliBgColor {
  if (statusCode >= 200 && statusCode < 300) return 'bgGreen'
  if (statusCode >= 300 && statusCode < 400) return 'bgYellow'
  if (statusCode >= 400 && statusCode < 500) return 'bgRed'
  return 'bgRedBright'
}
