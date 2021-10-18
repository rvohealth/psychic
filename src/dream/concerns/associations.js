import HasOne from 'src/dream/association/has-one'
import HasOneThrough from 'src/dream/association/has-one-through'
import HasMany from 'src/dream/association/has-many'
import HasManyThrough from 'src/dream/association/has-many-through'
import BelongsTo from 'src/dream/association/belongs-to'
import camelCase from 'src/helpers/camelCase'
import InvalidThroughArgument from 'src/error/dream/association/invalid-through-argument'

const AssociationsProvider = superclass => class extends superclass {
  static _associations = {}
  constructor(...args) {
    super(...args)

    this._associations = {}
  }

  static belongsTo(resourceName, opts={}) {
    const association = BelongsTo.new(this.resourceName, resourceName, opts)
    this._addAssociation(association)

    const cb = async function () {
      return new association.associationDreamClass(
        await association.query(this[association.foreignKey])
      )
    }

    this.prototype[resourceName] = cb
    this.prototype[camelCase(resourceName)] = cb

    return this
  }

  static hasOne(resourceName, opts={}) {
    if (opts.through) {
      if (!this._association(opts.through)) throw new InvalidThroughArgument()
      opts.through = this._association(opts.through)
    }

    const association = opts.through ?
      HasOneThrough.new(this.resourceName, resourceName, opts) :
      HasOne.new(this.resourceName, resourceName, opts)

    this._addAssociation(association)

    const cb = async function () {
      return new association.associationDreamClass(
        await association.query(this.id)
      )
    }

    this.prototype[resourceName] = cb
    this.prototype[camelCase(resourceName)] = cb

    return this
  }

  static hasMany(resourceName, opts={}) {
    if (opts.through) {
      if (!this._association(opts.through)) throw new InvalidThroughArgument()
      opts.through = this._association(opts.through)
    }

    const association = opts.through ?
      HasManyThrough.new(this.resourceName, resourceName, opts) :
      HasMany.new(this.resourceName, resourceName, opts)

    this._addAssociation(association)

    const cb = async function () {
      const results = await association.query(this.id)
      return results.map(result => new association.associationDreamClass(result))
    }

    this.prototype[resourceName] = cb
    this.prototype[camelCase(resourceName)] = cb

    return this
  }

  static _association(resourceName) {
    if (!resourceName) return null
    return this._associations[resourceName]
  }

  static _addAssociation(association) {
    this._associations[association.resourceName] = association
  }

  _association(resourceName) {
    return this.constructor._association(resourceName)
  }
}

export default AssociationsProvider
