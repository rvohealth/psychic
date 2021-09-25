import pluralize from 'pluralize'
import snakeCase from 'src/helpers/snakeCase'
import config from 'src/config'
import PresenceCheckFailed from 'src/error/dream/validation/presence-check-failed'
import UniqueCheckFailed from 'src/error/dream/validation/unique-check-failed'
import InclusionCheckFailed from 'src/error/dream/validation/inclusion-check-failed'
import ExclusionCheckFailed from 'src/error/dream/validation/exclusion-check-failed'
import esp from 'src/singletons/esp'
import Psyclass from 'src/psychic/psyclass'

import AuthenticationProvider from 'src/dream/concerns/authentication'
import HooksProvider from 'src/dream/concerns/hooks'
import QueryProvider from 'src/dream/concerns/query'
import AssociationsProvider from 'src/dream/concerns/associations'
import AttributesProvider from 'src/dream/concerns/attributes'
import DirtyProvider from 'src/dream/concerns/dirty'

class Dream extends Psyclass {
  constructor(attributes={}) {
    super()

    this._afterCreate = []
    this._afterDestroy = []
    this._afterUpdate = []
    this._afterSave = []
    this._associations = {}
    this._authentications = {
      db: {},
    }
    this._beforeCreate = []
    this._beforeDestroy = []
    this._beforeSave = []
    this._beforeUpdate = []
    this._emitsTo = {}
    this._validations = {}
    this._resetAttributes(attributes)

    this.initialize()
  }

  static get isDream() {
    return true
  }

  static get columns() {
    return config.schema[this.table]
  }

  static get resourceName() {
    return snakeCase(this.name)
  }

  static get schema() {
    return config.schema[this.table]
  }

  static get table() {
    if (this._table) return this._table
    return pluralize(snakeCase(this.name))
  }

  static set table(tableName) {
    this._table = tableName
  }

  get attributes() {
    return this._attributes
  }

  get attributeNames() {
    return Object.keys(this._attributes)
  }

  get originalAttributes() {
    return this._originalAttributes
  }

  get schema() {
    return this.constructor.schema
  }

  get dirty() {
    return !!this.attributeNames.filter(name => this.hasUnsavedAttribute(name)).length
  }

  get dirtyAttributes() {
    return this.attributeNames
      .filter(name => this.hasUnsavedAttribute(name))
      .reduce((agg, name) => {
        agg[name] = this.attribute(name)
        return agg
      }, {})
  }

  get isDream() {
    return this.constructor.isDream
  }

  get isDreamInstance() {
    return true
  }

  get persisted() {
    return !!this.id
  }

  get resourceName() {
    return this.constructor.resourceName
  }

  get table() {
    return this.constructor.table
  }

  get isNewRecord() {
    return !this.persisted
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

  initialize() {
    // define in child class
  }

  validates(column, opts) {
    this._validations[column] = this._validations[column] || []
    this._validations[column].push(opts)
    return this
  }

  async _runValidations() {
    for (const column in this._validations) {
      const validations = this._validations[column]
      for (const i in validations) {
        const validation = validations[i]
        if (
          validation.presence &&
            !this[column + 'IsPresent']
        )
          throw new PresenceCheckFailed(`Failed to check presence for column ${this.table}.${column}`)

        if (
          validation.unique &&
            !(await this[column + 'IsUnique']())
        )
          throw new UniqueCheckFailed(`Failed to check presence for column ${this.table}.${column}`)

        if (
          validation.inclusion &&
            !validation.inclusion.includes(this[column])
        )
          throw new InclusionCheckFailed(`expected ${this[column]} in ${validation.inclusion}`)

        if (
          validation.exclusion &&
            validation.exclusion.includes(this[column])
        )
          throw new ExclusionCheckFailed(`expected ${this[column]} in ${validation.exclusion}`)
      }
    }
  }
}

Dream.include(QueryProvider)
Dream.include(AttributesProvider)
Dream.include(DirtyProvider)
Dream.include(AssociationsProvider)
Dream.include(AuthenticationProvider)
Dream.include(HooksProvider)

export default Dream
