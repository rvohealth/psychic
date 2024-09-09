export class Logger {
  public cache: string[] = []
  public write(text: string, { cache = false }: { cache?: boolean } = {}) {
    console.log(text)
    if (cache) this.cache.push(text)
  }

  public restoreCache(preRestoreContent?: string) {
    this.clear()

    if (preRestoreContent) this.write(preRestoreContent)

    this.cache.forEach(str => {
      this.write(str)
    })
  }

  public clear() {
    console.clear()
    // @ts-expect-error this works fine with no args provided
    process.stdout.clearLine()
    process.stdout.cursorTo(0)
  }
}

const log = new Logger()
export default log
