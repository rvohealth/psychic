import * as colors from 'colorette'
import { DateTime } from 'luxon'
import logo from '../psychic-application/logo'

export class Logger {
  public get header() {
    return `[${DateTime.now().toLocaleString(DateTime.DATETIME_SHORT_WITH_SECONDS)}]: `
  }

  public puts(text: string, color = 'magentaBright') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    console.log((colors as any)[color](text).split('\n').join('\n  '))
  }

  public info(text: string) {
    this.puts(text, 'blue')
  }

  public error(error: Error | string) {
    if (typeof error === 'string') {
      this.puts(error, 'red')
    } else {
      this.puts(error.message, 'red')
      this.puts(error.stack!)
    }
  }

  public welcome() {
    this.puts(logo())
  }
}

const log = new Logger()
export default log
