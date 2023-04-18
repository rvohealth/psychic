import { Command } from 'commander'
import sspawn from './sspawn'

export default function dreamcmd(
  program: Command,
  commandString: string,
  description: string,
  aliasString?: string
) {
  program
    .command(commandString)
    .description(description)
    .action(async () => {
      const nodeEnvString =
        process.env.NODE_ENV && process.env.NODE_ENV !== 'development'
          ? `NODE_ENV=${process.env.NODE_ENV} `
          : ''

      const cmd = `${nodeEnvString} ${commandString}`
      if (process.env.DEBUG == '1')
        console.log(`[DEBUG]: the following yarn command is being aliased by psychic cli: ${cmd}`)

      await sspawn(cmd)
    })
}
