import ora from 'ora'

export default class LogAnimator {
  get spinner() {
    return this._spinner
  }

  constructor() {
    this._spinner = null
  }

  stop() {
    if (this.spinner)
      this.spinner.stop()
  }

  animate(thing, logs=[]) {
    this.stop()
    console.clear()

    const existingLines = logs.map(lit =>
      (
        lit.literal ?
          '' :
          `psy:logger > `
      ) + lit.text
    )
    this._spinner = ora({
      prefixText: existingLines.join('\n') + '\n',
      color: 'yellow',
      text: thing,
      spinner: 'grenade', // LOVE IT!!
      // spinner: 'shark',
      // spinner: 'moon',
      // spinner: 'circle', // looks like an eye sort of
      // spinner: 'balloon',
      // spinner: 'dots8Bit',
    })
    this.spinner.start()
  }
}
