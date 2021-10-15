Array.prototype.uniq = function() {
  return [...new Set(this)]
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
