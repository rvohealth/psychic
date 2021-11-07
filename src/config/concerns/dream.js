const DreamConfigProvider = superclass => class extends superclass {
  get dreamPath() {
    return `${this.root}.dist/dreams`
  }

  get dreams() {
    return this._dreams
  }

  dream(dreamName) {
    const dream = this.dreams[dreamName.snakeify()]
    return dream?.default || dream
  }

  lookup(className) {
    return this.dream(className)
  }
}

export default DreamConfigProvider

