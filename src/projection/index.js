export default class Projection {
  static attributes = null

  get dream() {
    return this._dream
  }

  constructor(dream) {
    this._dream = dream
  }

  cast() {
    const attributes = this.dream.attributes
    return this._applyFilters(attributes)
  }

  _applyFilters(attributes) {
    if (!this.constructor.attributes) return attributes

    return this.constructor.attributes
      .reduce((agg, attr) => {
        if (attributes[attr])
          agg[attr] = attributes[attr]

        else if (typeof this[attr] === 'function')
          agg[attr] = this[attr]()

        else
          agg[attr] = this[attr]

        return agg
      }, {})
  }
}
