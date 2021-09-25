import HasOne from 'src/dream/association/has-one'
import HasOneThrough from 'src/dream/association/has-one-through'
import HasMany from 'src/dream/association/has-many'
import HasManyThrough from 'src/dream/association/has-many-through'
import BelongsTo from 'src/dream/association/belongs-to'
import camelCase from 'src/helpers/camelCase'

export default class Associations {
  belongsTo(resourceName, opts) {
    const association = new BelongsTo(this.resourceName, resourceName, opts)
    this._addAssociation(association)

    this[resourceName] = async () =>
      new association.associationDreamClass(
        await association.query(this[association.foreignKey])
      )

    this[camelCase(resourceName)] = async () =>
      new association.associationDreamClass(
        await association.query(this[association.foreignKey])
      )

    return this
  }

  hasOne(resourceName, opts) {
    if (opts.through) {
      if (!this._association(opts.through)) throw `Missing intermediary association for ${opts.through}. make sure to declare association before through association`
      opts.through = this._association(opts.through)
    }

    const association = opts.through ?
      new HasOneThrough(this.resourceName, resourceName, opts) :
      new HasOne(this.resourceName, resourceName, opts)

    this._addAssociation(association)

    this[resourceName] = async () =>
      new association.associationDreamClass(
        await association.query(this.id)
      )

    this[camelCase(resourceName)] = async () =>
      new association.associationDreamClass(
        await association.query(this.id)
      )

    return this
  }

  hasMany(resourceName, opts) {
    if (opts.through) {
      if (!this._association(opts.through)) throw `Missing intermediary association for ${opts.through}. make sure to declare association before through association`
      opts.through = this._association(opts.through)
    }

    const association = opts.through ?
      new HasManyThrough(this.resourceName, resourceName, opts) :
      new HasMany(this.resourceName, resourceName, opts)

    this._addAssociation(association)

    this[resourceName] = async () => {
      const results = await association.query(this.id)
      return results.map(result => new association.associationDreamClass(result))
    }

    this[camelCase(resourceName)] = async () => {
      const results = await association.query(this.id)
      return results.map(result => new association.associationDreamClass(result))
    }

    return this
  }

  _association(resourceName) {
    return this._associations[resourceName]
  }

  _addAssociation(association) {
    this._associations[association.association] = association
  }
}
