import HasOne from 'src/dream/association/has-one'
import HasOneThrough from 'src/dream/association/has-one-through'
import HasMany from 'src/dream/association/has-many'
import HasManyThrough from 'src/dream/association/has-many-through'
import BelongsTo from 'src/dream/association/belongs-to'
import camelCase from 'src/helpers/camelCase'
import InvalidThroughArgument from 'src/error/dream/association/invalid-through-argument'

const AssociationsProvider = superclass => class extends superclass {
  constructor(...args) {
    super(...args)

    this._associations = {}
  }

  belongsTo(resourceName, opts={}) {
    const association = BelongsTo.new(this.resourceName, resourceName, opts)
    this._addAssociation(association)

    const cb = async () =>
      new association.associationDreamClass(
        await association.query(this[association.foreignKey])
      )

    this[resourceName] = cb
    this[camelCase(resourceName)] = cb

    return this
  }

  hasOne(resourceName, opts={}) {
    if (opts.through) {
      if (!this._association(opts.through)) throw new InvalidThroughArgument()
      opts.through = this._association(opts.through)
    }

    const association = opts.through ?
      HasOneThrough.new(this.resourceName, resourceName, opts) :
      HasOne.new(this.resourceName, resourceName, opts)

    this._addAssociation(association)

    const cb = async () =>
      new association.associationDreamClass(
        await association.query(this.id)
      )

    this[resourceName] = cb
    this[camelCase(resourceName)] = cb

    return this
  }

  hasMany(resourceName, opts={}) {
    if (opts.through) {
      if (!this._association(opts.through)) throw new InvalidThroughArgument()
      opts.through = this._association(opts.through)
    }

    const association = opts.through ?
      HasManyThrough.new(this.resourceName, resourceName, opts) :
      HasMany.new(this.resourceName, resourceName, opts)

    this._addAssociation(association)

    const cb = async () => {
      const results = await association.query(this.id)
      return results.map(result => new association.associationDreamClass(result))
    }

    this[resourceName] = cb
    this[camelCase(resourceName)] = cb

    return this
  }

  _association(resourceName) {
    return this._associations[resourceName]
  }

  _addAssociation(association) {
    this._associations[association.resourceName] = association
  }
}

export default AssociationsProvider
