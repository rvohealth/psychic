import esp from 'src/esp'
import InvalidEmitsToAsArgument from 'src/error/dream/ws/emits-to/invalid-as-argument'
import InvalidEmitsToRelationNameArgument from 'src/error/dream/ws/emits-to/invalid-relation-name-argument'
import InvalidEmitRelationNameArgument from 'src/error/dream/ws/emits/invalid-relation-name-argument'

const WSProvider = superclass => class extends superclass {
  static _emitsTo = {}

  static emitsTo(relationName, opts={}) {
    if (!this._association(relationName)) throw new InvalidEmitsToRelationNameArgument()
    if (!opts.as) throw new InvalidEmitsToAsArgument()

    this._emitsTo[relationName] = {
      to: relationName,
      ...opts,
    }
    return this
  }

  async emit(relationName, path, message=null) {
    const emitRecord = this.constructor._emitsTo[relationName]
    if (!emitRecord) throw new InvalidEmitRelationNameArgument()

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
