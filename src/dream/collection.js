class Collection extends Array {
  constructor(dreamClass, results) {
    super(...results)
    if (!dreamClass) throw 'Dream class is required to initialize a collection'

    this.dreamClass = dreamClass
    this.results = results
  }

  map(cb) {
    return this.results.map(cb)
  }

  forEach(cb) {
    return this.results.forEach(cb)
  }

  count() {
    return this.results.length
  }
}

export default Collection
