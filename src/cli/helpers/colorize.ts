import c from 'yoctocolors'

export default function colorize(
  text: string,
  {
    color,
    bgColor,
  }: {
    color?: PsychicCliForegroundColor | undefined
    bgColor?: PsychicCliBgColor | undefined
  },
) {
  const foregroundApplied = color ? c[color](text) : text
  return bgColor ? c[bgColor](foregroundApplied) : foregroundApplied
}

export type PsychicCliForegroundColor =
  | 'black'
  | 'red'
  | 'redBright'
  | 'green'
  | 'greenBright'
  | 'yellow'
  | 'yellowBright'
  | 'blue'
  | 'blueBright'
  | 'magenta'
  | 'magentaBright'
  | 'cyan'
  | 'cyanBright'
  | 'white'
  | 'whiteBright'
  | 'gray'

export type PsychicCliBgColor =
  | 'bgBlack'
  | 'bgRed'
  | 'bgRedBright'
  | 'bgGreen'
  | 'bgGreenBright'
  | 'bgYellow'
  | 'bgYellowBright'
  | 'bgBlue'
  | 'bgBlueBright'
  | 'bgMagenta'
  | 'bgMagentaBright'
  | 'bgCyan'
  | 'bgCyanBright'
  | 'bgWhite'
  | 'bgWhiteBright'
