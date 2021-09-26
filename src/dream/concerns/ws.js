import esp from 'src/singletons/esp'

const WSProvider = superclass => class extends superclass {
  constructor(...args) {
    super(...args)

    this._emitsTo = {}
  }

  emitsTo(relationName, opts) {
    if (!opts.as) throw `must pass 'as' in second argument`
    if (!this._association(relationName)) throw `relationName must be a valid association. make sure your association was delared in initialize.`

    this._emitsTo[relationName] = {
      to: relationName,
      ...opts,
    }
    return this
  }

  async emit(relationName, path, message=null) {
    const emitRecord = this._emitsTo[relationName]
    if (!emitRecord) throw `must instantiate relation using 'emitsTo' in initialize`

    // since association could be deeply nested, safest thing to do here is to fetch the association.
    const association = await this[relationName]()
    if (!association) return // no error here, since we simply don't emit to non-existant associations

    esp.transmit('ws:to:authToken', {
      to: emitRecord.as,
      id: association.id,
      path: path.replace(/^\//, ''),
      data: message,
    })
  }
}

export default WSProvider
