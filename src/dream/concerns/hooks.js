class ModelHookProvider {
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
