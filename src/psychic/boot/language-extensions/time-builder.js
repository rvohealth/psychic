import TimeBuilder from 'src/helpers/time-builder'

const timebuilderGetterFor = (method) => {
  return {
    get: function() {
      return new TimeBuilder()[method](this)
    },
    configurable: true,
  }
}

Object.defineProperty(Number.prototype, 'second', timebuilderGetterFor('seconds'))
Object.defineProperty(Number.prototype, 'seconds', timebuilderGetterFor('seconds'))
Object.defineProperty(Number.prototype, 'minute', timebuilderGetterFor('minutes'))
Object.defineProperty(Number.prototype, 'minutes', timebuilderGetterFor('minutes'))
Object.defineProperty(Number.prototype, 'hour', timebuilderGetterFor('hours'))
Object.defineProperty(Number.prototype, 'hours', timebuilderGetterFor('hours'))
Object.defineProperty(Number.prototype, 'day', timebuilderGetterFor('days'))
Object.defineProperty(Number.prototype, 'days', timebuilderGetterFor('days'))
Object.defineProperty(Number.prototype, 'month', timebuilderGetterFor('months'))
Object.defineProperty(Number.prototype, 'months', timebuilderGetterFor('months'))
Object.defineProperty(Number.prototype, 'year', timebuilderGetterFor('years'))
Object.defineProperty(Number.prototype, 'years', timebuilderGetterFor('years'))
