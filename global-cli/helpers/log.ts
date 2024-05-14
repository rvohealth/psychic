export class Logger {
  public cache: string[] = []
  public loaders: Loader[] = []
  public write(text: string, { cache = false }: { cache?: boolean } = {}) {
    console.log(text)
    if (cache) this.cache.push(text)
  }

  public loader(text?: string) {
    this.loaders.push(new Loader('cats').start(text))
  }

  public restoreCache(preRestoreContent?: string) {
    this.loaders.forEach(loader => loader.stop())
    this.clear()

    if (preRestoreContent) this.write(preRestoreContent)

    this.cache.forEach(str => {
      this.write(str)
    })
  }

  public clear() {
    console.clear()
    // @ts-ignore
    process.stdout.clearLine()
    process.stdout.cursorTo(0)
  }
}

class Loader {
  public type: LoaderType
  public index = 0
  public interval: any = null
  constructor(type: LoaderType) {
    this.type = type
  }

  public start(text?: string) {
    this.interval = setInterval(() => {
      this.index = this.index === animations[this.type].length - 1 ? 0 : this.index + 1
      process.stdout.moveCursor(0, -1)
      process.stdout.clearLine(1)
      console.log(animations[this.type][this.index])
    }, 100)
    return this
  }

  public stop() {
    if (this.interval) clearInterval(this.interval)
  }
}

const animations = {
  dots: ['.', '..', '...'],
  cats: [
    '̳៱˳_˳៱ ̳∫',
    '̳៱˳_˳៱ ̳ﾉ',
    '̳៱˳_˳៱ ̳∫',
    '̳៱˳_˳៱ ̳ﾉ',
    '̳៱˳_˳៱ ̳∫',
    '̳៱˳_˳៱ ̳ﾉ',
    '(≗ᆽ≗)ﾉ',
    '(≗ᆽ≗)ﾉ',
    '(≗ᆽ≗)ﾉ',
    '(=◕ᆽ◕ฺ=)∫',
    '(=◕ᆽ◕ฺ=)ﾉ',
    '(₌ꈍᆽꈍ₌)_',
    '(₌ꈍᆽꈍ₌)_',
  ],
}

type LoaderType = 'dots' | 'cats'

const log = new Logger()
export default log
