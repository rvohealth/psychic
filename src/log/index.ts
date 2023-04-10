import * as fs from 'fs'
import * as colors from 'colorette'
import logo from '../config/logo'
import logPath from '../config/helpers/logPath'
import { DateTime } from 'luxon'

export class Logger {
  public get header() {
    return `[${DateTime.now().toLocaleString(DateTime.DATETIME_SHORT_WITH_SECONDS)}]: `
  }

  public puts(text: string, color = 'magentaBright') {
    console.log('  ' + (colors as any)[color](text).split('\n').join('\n  '))
  }

  public async write(text: string, color?: string) {
    this.puts(text, color)
    const thisFs = fs ? fs : await import('fs')
    return await thisFs.promises.appendFile(logPath(), this.header + text + '\n')
  }

  public info(text: string) {
    this.puts(text, 'blue')
  }

  public error(error: Error | string) {
    if (typeof error === 'string') {
      this.write(error, 'red')
    } else {
      this.write(error.message, 'red')
      this.write(error.stack!)
    }
  }

  public welcome(port = process.env.PORT || 7777) {
    this.puts(logo())
  }
}

global.__howl_logger = new Logger()
const log = global.__howl_logger

export default log
