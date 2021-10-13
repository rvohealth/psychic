class Factory {
  static async dreams() {
    if (this._dreams) return this._dreams

    this._dreams = await import('app/pkg/dreams.pkg.js')
    return this._dreams
  }

  static async create(dreamName, attrs) {
    const dreams = await this.dreams()
    console.log(dreamName, attrs, dreams)
  }
}

export default Factory
