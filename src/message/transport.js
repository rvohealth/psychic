export default class Transport {
  get config() {
    return this._config
  }

  constructor(_config) {
    this._config = _config
    this.initialize()
  }

  async verify() {
    return await this._verify()
  }
}
