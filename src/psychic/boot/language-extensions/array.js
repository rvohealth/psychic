Array.prototype.uniq = function() {
  return [...new Set(this)]
}

Object.defineProperty(Array.prototype, 'first', {
  get: function() {
    return this[0]
  },
  configurable: true,
})

Object.defineProperty(Array.prototype, 'second', {
  get: function() {
    return this[1]
  },
  configurable: true,
})

Object.defineProperty(Array.prototype, 'third', {
  get: function() {
    return this[2]
  },
  configurable: true,
})

Object.defineProperty(Array.prototype, 'fourth', {
  get: function() {
    return this[3]
  },
  configurable: true,
})

Object.defineProperty(Array.prototype, 'last', {
  get: function() {
    return this[this.length - 1]
  },
  configurable: true,
})
