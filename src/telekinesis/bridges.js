import Telekinesis from 'src/telekinesis'

export default class TelekineticBridges {
  constructor() {
    this._bridges = {}
  }
  // called during config boot sequence. arguably this should be moved to the constructor
  // and perhaps the singleton instances should be done away with, and instead defined when
  // config is booted? Likely it would be less confusing that way, since this way we can have
  // the singleton instance floating around unconfigured within the app.
  setConfig(telekinesisConfig) {
    this._telekinesisConfig = telekinesisConfig

    Object
      .keys(telekinesisConfig)
      .forEach(telekinesisKey => {
        const _config = telekinesisConfig[telekinesisKey]
        this._bridges[telekinesisKey] = new Telekinesis({
          key: telekinesisKey,
          config: _config,
          adapter: _config.adapter,
        })
      })
  }
}
