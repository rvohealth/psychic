const ModelHookProvider = superclass => class extends superclass {
  static _beforeCreate = []
  static _beforeDestroy = []
  static _beforeSave = []
  static _beforeUpdate = []
  static _afterCreate = []
  static _afterDestroy = []
  static _afterUpdate = []
  static _afterSave = []

  static async afterCreate(cb) {
    this._afterCreate.push(cb)
  }

  static async afterDestroy(cb) {
    this._afterDestroy.push(cb)
  }

  static async afterSave(cb) {
    this._afterSave.push(cb)
  }

  static async afterUpdate(cb) {
    this._afterUpdate.push(cb)
  }

  static async beforeCreate(cb) {
    this._beforeCreate.push(cb)
  }

  static async beforeDestroy(cb) {
    this._beforeDestroy.push(cb)
  }

  static async beforeSave(cb) {
    this._beforeSave.push(cb)
  }

  static async beforeUpdate(cb) {
    this._beforeUpdate.push(cb)
  }

  async afterCreate(cb) {
    this.constructor._afterCreate.push(cb)
  }

  async afterDestroy(cb) {
    this.constructor._afterDestroy.push(cb)
  }

  async afterSave(cb) {
    this.constructor._afterSave.push(cb)
  }

  async afterUpdate(cb) {
    this.constructor._afterUpdate.push(cb)
  }

  async beforeCreate(cb) {
    this.constructor._beforeCreate.push(cb)
  }

  async beforeDestroy(cb) {
    this.constructor._beforeDestroy.push(cb)
  }

  async beforeSave(cb) {
    this.constructor._beforeSave.push(cb)
  }

  async beforeUpdate(cb) {
    this.constructor._beforeUpdate.push(cb)
  }

  async _runHooksFor(hookType) {
    for (const cb of this.constructor[`_${hookType}`]) {
      const _cb = cb.bind(this)
      await _cb()
    }
  }
}

export default ModelHookProvider
