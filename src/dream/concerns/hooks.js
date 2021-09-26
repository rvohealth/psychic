const ModelHookProvider = superclass => class extends superclass {
  constructor(...args) {
    super(...args)

    this._beforeCreate = []
    this._beforeDestroy = []
    this._beforeSave = []
    this._beforeUpdate = []
    this._afterCreate = []
    this._afterDestroy = []
    this._afterUpdate = []
    this._afterSave = []
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

  async _runHooksFor(hookType) {
    for (const cb of this[`_${hookType}`]) {
      await cb()
    }
  }
}

export default ModelHookProvider
