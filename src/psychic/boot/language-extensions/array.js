Array.prototype.uniq = function(cb) {
  if (cb) return this.uniqBy(cb)
  return [...new Set(this)]
}

Array.prototype.uniqBy = function(cb) {
  const tmpArr = []
  return this
    .map((item, index) => {
      const result = cb(this[index])

      if (tmpArr.includes(result)) return null
      tmpArr.push(result)

      return this[index]
    })
    .compact()
}

Array.prototype.alpha = function(field) {
  return this.sort((a, b) => {
    var nameA = field ? a[field] : a
    var nameB = field ? b[field] : b

    if (nameA < nameB) return -1
    if (nameA > nameB) return 1
    return 0
  })
}

Array.prototype.compact = function ({ removeBlank }={}) {
  return this.filter(el =>
    el !== null &&
      el !== undefined &&
      (!removeBlank || el !== '')
  )
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

Object.defineProperty(Array.prototype, 'empty', {
  get: function() {
    return this.length === 0
  },
  configurable: true,
})

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
