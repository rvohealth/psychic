import TimeBuilder from 'src/boot/language-extensions/time/builder'

Array.prototype.uniq = function() {
  return [...new Set(this)]
}

String.prototype.capitalize = function() {
  return this.charAt(0).toUpperCase() + this.slice(1)
}

Object.defineProperty(Array.prototype, 'first', {
  get: function() {
    return this[0]
  },
  configurable: true,
})

Object.defineProperty(Array.prototype, 'last', {
  get: function() {
    return this[this.length - 1]
  },
  configurable: true,
})

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
