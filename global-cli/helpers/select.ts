import * as colors from 'colorette'
import * as readline from 'readline'
const input = process.stdin
const output = process.stdout

let firstCallComplete = false
export default class Select<T extends readonly any[]> {
  private question: string
  private selectIndex: number = 0
  private options: T
  private selector: string = '>'
  private isFirstTimeShowMenu: boolean = true
  private cb: ((answer: T[number]) => void) | null = null

  constructor(question: string, options: T) {
    this.question = question
    this.options = options
  }

  public async run(): Promise<T[number]> {
    await this.init()
    return new Promise(accept => {
      this.cb = accept as any
    })
  }

  private keyPressedHandler(_: any, key: any) {
    if (key) {
      const optionLength = this.options.length - 1
      if (key.name === 'down' && this.selectIndex < optionLength) {
        this.selectIndex += 1
        this.createOptionMenu()
      } else if (key.name === 'up' && this.selectIndex > 0) {
        this.selectIndex -= 1
        this.createOptionMenu()
      } else if (key.name === 'return') {
        this.cb?.(this.options[this.selectIndex] as T[number])
        input.removeAllListeners('keypress')

        if (firstCallComplete) {
          output.write('\n')
        } else {
          firstCallComplete = true
        }

        input.setRawMode(false)
        input.pause()
      } else if (key.name === 'escape' || (key.name === 'c' && key.ctrl)) {
        this.close()
      }
    }
  }

  private ansiEraseLines(count: number) {
    //adapted from sindresorhus ansi-escape module
    const ESC = '\u001B['
    const eraseLine = ESC + '2K'
    const cursorUp = (count = 1) => ESC + count + 'A'
    const cursorLeft = ESC + 'G'

    let clear = ''

    for (let i = 0; i < count; i++) {
      clear += eraseLine + (i < count - 1 ? cursorUp() : '')
    }

    if (count) {
      clear += cursorLeft
    }

    return clear
  }

  private async init() {
    console.log(this.question)

    readline.emitKeypressEvents(input)
    this.start()
  }

  private start() {
    //setup the input for reading
    input.setRawMode(true)
    input.resume()
    input.on('keypress', (event, key) => this.keyPressedHandler(event, key))

    if (this.selectIndex >= 0) {
      this.createOptionMenu()
    }
  }

  public close = () => {
    input.setRawMode(false)
    input.pause()
    process.exit(0)
  }

  private getPadding(num = 10) {
    let text = ' '
    for (let i = 0; i < num; i++) {
      text += ' '
    }
    return text
  }

  private createOptionMenu() {
    const optionLength = this.options.length
    if (this.isFirstTimeShowMenu) {
      this.isFirstTimeShowMenu = false
    } else {
      output.write(this.ansiEraseLines(optionLength))
    }
    const padding = this.getPadding(0)
    const cursor = colors.magenta(this.selector)

    for (let i = 0; i < optionLength; i++) {
      const selectedOption =
        i === this.selectIndex
          ? `${cursor} ${this.options[i]}`
          : `${cursor.replace(/.*/, ' ')} ${this.options[i]}`
      const ending = i !== optionLength - 1 ? '\n' : ''
      output.write(padding + selectedOption + ending)
    }
  }
}
