const TelekinesisConfigProvider = superclass => class extends superclass {
  get telekinesisConfig() {
    if (!this._telekinesisConfig) console.trace()
    if (!this._telekinesisConfig) throw `config not booted yet`
    return this._telekinesisConfig[this.env]
  }
}

export default TelekinesisConfigProvider
