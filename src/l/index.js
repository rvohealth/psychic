// shorthand for "Logger". Tactfully named to be easy to import, and also named after the brilliant detective
// from the anime "Death Note", which is one of my FAV animes of all time.
import chalk from 'chalk'
import LogAnimator from 'src/l/animator'

export default class L {
  get animator() {
    return this._animator
  }

  get logs() {
    return this._logs
  }

  constructor() {
    this._logs = []
    this._animator = new LogAnimator()
  }

  end() {
    this.animator.stop()
  }

  log(thing, { level }={}) {
    this._logs.push({ text: thing, literal: false })
    const color = chalk[this._colorFromLevel(level)]
    const statusColor = level ? color : chalk.bgMagenta.yellow
    console.log(
      statusColor(` psy:log > `),
      color(thing)
    )
  }

  logLiteral(thing, { level }={}) {
    const color = chalk[this._colorFromLevel(level)]
    this._logs.push({ text: thing.replace(/\n$/, ''), literal: true })
    console.log(color(thing))
  }

  logStatus(thing, { level }={}) {
    const color = chalk[this._colorFromLevel(level)]
    const statusColor = level ? color : chalk.bgMagenta.yellow
    this.animator.animate(
      statusColor(` psy:status > `) + color(` ${thing}`),
      this.logs
    )
  }

  _colorFromLevel(level) {
    switch(level) {
    case 'info':
      return 'cyan'

    case 'warn':
      return 'yellow'

    case 'error':
      return 'red'

    default:
      return 'white'
    }
  }
}
