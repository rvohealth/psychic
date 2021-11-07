const ModelHookProvider = superclass => class extends superclass {
  static _beforeCreate = {}
  static _beforeDestroy = {}
  static _beforeSave = {}
  static _beforeUpdate = {}
  static _afterCreate = {}
  static _afterDestroy = {}
  static _afterUpdate = {}
  static _afterSave = {}

  static async afterCreate(cb) {
    if (!this._afterCreate[this.name])
      this._afterCreate[this.name] = []
    this._afterCreate[this.name].push(cb)
  }

  static async afterDestroy(cb) {
    if (!this._afterDestroy[this.name])
      this._afterDestroy[this.name] = []
    this._afterDestroy[this.name].push(cb)
  }

  static async afterSave(cb) {
   if (!this._afterSave[this.name])
      this._afterSave[this.name] = []
    this._afterSave[this.name].push(cb)
  }

  static async afterUpdate(cb) {
    if (!this._afterUpdate[this.name])
      this._afterUpdate[this.name] = []
    this._afterUpdate[this.name].push(cb)
  }

  static async beforeCreate(cb) {
    if (!this._beforeCreate[this.name])
      this._beforeCreate[this.name] = []
    this._beforeCreate[this.name].push(cb)
  }

  static async beforeDestroy(cb) {
    if (!this._beforeDestroy[this.name])
      this._beforeDestroy[this.name] = []
    this._beforeDestroy[this.name].push(cb)
  }

  static async beforeSave(cb) {
    if (!this._beforeSave[this.name])
      this._beforeSave[this.name] = []
    this._beforeSave[this.name].push(cb)
  }

  static async beforeUpdate(cb) {
    if (!this._beforeUpdate[this.name])
      this._beforeUpdate[this.name] = []
    this._beforeUpdate[this.name].push(cb)
  }

  async _runHooksFor(hookType) {
    if (!this.constructor[`_${hookType}`][this.constructor.name]) return

    for (const cb of this.constructor[`_${hookType}`][this.constructor.name]) {
      if (typeof cb === 'string') await this[cb]()
      else await cb.apply(this)
    }
  }
}

export default ModelHookProvider
