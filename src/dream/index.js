import jwt from 'jsonwebtoken'
import pluralize from 'pluralize'
import bcrypt from 'bcrypt'
import Query from 'src/db/query'
import snakeCase from 'src/helpers/snakeCase'
import camelCase from 'src/helpers/camelCase'
import config from 'src/config'
import db from 'src/db'
import HasOne from 'src/dream/association/has-one'
import HasOneThrough from 'src/dream/association/has-one-through'
import HasMany from 'src/dream/association/has-many'
import HasManyThrough from 'src/dream/association/has-many-through'
import BelongsTo from 'src/dream/association/belongs-to'
import DBAuthentication from 'src/dream/authentication/db'
import PresenceCheckFailed from 'src/error/dream/validation/presence-check-failed'
import UniqueCheckFailed from 'src/error/dream/validation/unique-check-failed'
import InclusionCheckFailed from 'src/error/dream/validation/inclusion-check-failed'
import ExclusionCheckFailed from 'src/error/dream/validation/exclusion-check-failed'
import { validatePresence, validateUnique } from 'src/helpers/validation'
import esp from 'src/singletons/esp'

class Dream {
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

  static async count() {
    return await db.count(this.table).do()
  }

  static async create(attributes) {
    const newRecord = new this(attributes)
    return await newRecord.save()
  }

  static async all() {
    const results = await new Query(this)
      .select('*')
      .from(this.table)
      .all()

    return results
  }

  static async find(id) {
    return new Query(this)
      .select('*')
      .from(this.table)
      .where({ id })
      .first()
  }

  static async first() {
    const result = await new Query(this)
      .select('*')
      .from(this.table)
      .first()

    if (result) return result
    return null
  }

  static select(...fields) {
    return new Query(this)
      .select(...fields)
      .from(this.table)
  }

  static where(...fields) {
    return new Query(this)
      .select('*')
      .from(this.table)
      .where(...fields)
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

  constructor(attributes={}) {
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

  async afterCreate(cb) {
    this._afterCreate.push(cb)
  }

  async afterDestroy(cb) {
    this._afterDestroy.push(cb)
  }

  async afterSave(cb) {
    this._afterSave.push(cb)
  }

  async afterUpdate(cb) {
    this._afterUpdate.push(cb)
  }

  async authenticate(...args) {
    if (args.length === 3) return this.authenticateFor(...args)
    if (args.length === 1) return this.authenticateAll(...args)
    return this.authenticateFor(...args)
  }

  async authenticateAll(password, opts) {
    return await this.authenticateFor(null, password, opts)
  }

  async authenticateFor(identifyingColumn, password, { strategy }={}) {
    strategy = strategy || 'db'
    switch(strategy) {
    case 'db':
      for (const key in this._authentications.db) {
        if (!!identifyingColumn && key.split('::')[0] !== identifyingColumn) continue
        const authentication = this._authentications.db[key]
        // console.log('ZIMMEBOY', password, authentication.passwordColumn, this)
        if (await bcrypt.compare(password, this[authentication.passwordColumn + '_digest']))
          return true
      }
      return false

    default:
      throw `unrecognized strategy ${strategy}`
    }
  }

  authenticates(identifyingColumn, passwordColumn, opts) {
    this._authentications.db[`${identifyingColumn}::${passwordColumn}`] =
      new DBAuthentication(identifyingColumn, passwordColumn, opts)

    this.beforeSave(async () => {
      if (this[`${passwordColumn}HasUnsavedChanges`]) {
        this[`${passwordColumn}_digest`] = await bcrypt.hash(this[passwordColumn], 11)
      }
    })

    return this
  }

  async authTokenFor(idAndPasswordStr) {
    // should throw error app secret is not set.
    const token = jwt.sign({
      key: idAndPasswordStr,
      dreamClass: this.constructor.name,
      id: this.id,
    }, process.env.PSYCHIC_SECRET || 'PLEASE_CHANGE_ME')
    return token
  }

  async beforeCreate(cb) {
    this._beforeCreate.push(cb)
  }

  async beforeDestroy(cb) {
    this._beforeDestroy.push(cb)
  }

  async beforeSave(cb) {
    this._beforeSave.push(cb)
  }

  async beforeUpdate(cb) {
    this._beforeUpdate.push(cb)
  }

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

  async destroy() {
    await this._runHooksFor('beforeDestroy')

    await db
      .delete('users')
      .where({ id: this.id })
      .do()

    await this._runHooksFor('afterDestroy')
    return true
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

  initialize() {
    // define in child class
  }

  async save() {
    await this._runHooksFor('beforeSave')
    await this._runValidations()

    if (this.isNewRecord) {
      await this._runHooksFor('beforeCreate')

      const newModel = new this.constructor(await db.insert(this.table, snakeCase({ ...this.dirtyAttributes })))
      this._resetAttributes(newModel.attributes)

      await this._runHooksFor('afterCreate')

    } else {
      await this._runHooksFor('beforeUpdate')

      const results = await db
        .update(this.table, { ...this.dirtyAttributes })
        .where({ id: this.id })
        .do()

      this._resetAttributes(results[0])

      await this._runHooksFor('afterUpdate')
    }

    await this._runHooksFor('afterSave')

    return this
  }

  attribute(name) {
    return this.attributes[name]
  }

  hasUnsavedAttribute(attributeName) {
    if (this.isNewRecord) return true

    if (this.originalAttributes[attributeName])
      return this.originalAttributes[attributeName] !== this.attribute(attributeName)

    if (!this.originalAttributes[attributeName] && this.attribute(attributeName) !== undefined)
      return true

    return false
  }

  setAttributes(attributes) {
    Object.keys(attributes).forEach(attr => {
      this[attr] = attributes[attr]
    })
  }

  async update(attributes) {
    this.setAttributes(attributes)
    return await this.save()
  }

  validates(column, opts) {
    this._validations[column] = this._validations[column] || []
    this._validations[column].push(opts)
    return this
  }

  _association(resourceName) {
    return this._associations[resourceName]
  }

  _addAssociation(association) {
    this._associations[association.association] = association
  }

  _resetAttributes(attributes) {
    this._attributes = attributes
    this._originalAttributes = { ...attributes }
    this._defineAttributeAccessors()
    this._defineDirtyAccessors()
  }

  async _runHooksFor(hookType) {
    for (const cb of this[`_${hookType}`]) {
      await cb()
    }
  }

  _defineAttributeAccessors() {
    Object.keys(this.constructor.schema).forEach(attributeName => {
      const camelCased = camelCase(attributeName)

      const attrAccessors = {
        get: () => this.attribute(attributeName),
        set: val => {
          this._attributes[attributeName] = val
        },
        configurable: true,
      }
      Object.defineProperty(this, attributeName, attrAccessors)
      if (camelCased !== attributeName)
        Object.defineProperty(this, camelCased, attrAccessors)

      const attrIsPresentAccessors = {
        get: () => {
          return validatePresence(this.table, attributeName, this[attributeName])
        },
        configurable: true,
      }
      Object.defineProperty(this, `${attributeName}IsPresent`, attrIsPresentAccessors)
      if (camelCased !== attributeName)
        Object.defineProperty(this, `${camelCased}IsPresent`, attrIsPresentAccessors)

      const attrIsUnique = async () => {
        return await validateUnique(this.constructor, attributeName, this[attributeName])
      }
      this[attributeName + 'IsUnique'] = attrIsUnique
      if (camelCased !== attributeName)
        this[camelCased + 'IsUnique'] = attrIsUnique
    })
  }

  _defineDirtyAccessors() {
    Object.keys(this.constructor.schema).forEach(attributeName => {
      const camelCased = camelCase(attributeName)
      const key = `${camelCased}HasUnsavedChanges`
      Object.defineProperty(this, key, {
        get: () => this.hasUnsavedAttribute(attributeName),
        configurable: true,
      })
    })
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

export default Dream
