Array.prototype.uniq = function() {
  return [...new Set(this)]
}

Array.prototype.insert = function (index, item) {
  this.splice(index, 0, item)
}

Array.prototype.insertBefore = function (str, item) {
  const strIndex = this.indexOf(str)
  this.splice(strIndex, 0, item)
}

Array.prototype.insertAfter = function (str, item) {
  const strIndex = this.indexOf(str)
  this.splice(strIndex + 1, 0, item)
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
