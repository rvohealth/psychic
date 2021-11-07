import Psyclass from 'src/psychic/psyclass'
import transports from 'src/singletons/transports'
import telekineticBridges from 'src/singletons/telekinetic-bridges'
import ghosts from 'src/ghost/ghosts'
import inflector from 'src/inflector'

import AuthConfigProvider from 'src/config/concerns/auth'
import BaseConfigProvider from 'src/config/concerns/base'
import ChannelsConfigProvider from 'src/config/concerns/channels'
import DBConfigProvider from 'src/config/concerns/db'
import DreamConfigProvider from 'src/config/concerns/dream'
import MessagesConfigProvider from 'src/config/concerns/messages'
import MigrateConfigProvider from 'src/config/concerns/migrate'
import ProjectionsConfigProvider from 'src/config/concerns/projections'
import RedisConfigProvider from 'src/config/concerns/redis'
import RoutesConfigProvider from 'src/config/concerns/routes'
import TelekinesisConfigProvider from 'src/config/concerns/telekinesis'

import mix from 'src/helpers/mix'

class Config extends mix(Psyclass).with(
  AuthConfigProvider,
  BaseConfigProvider,
  ChannelsConfigProvider,
  DBConfigProvider,
  DreamConfigProvider,
  MessagesConfigProvider,
  MigrateConfigProvider,
  ProjectionsConfigProvider,
  RedisConfigProvider,
  RoutesConfigProvider,
  TelekinesisConfigProvider,
) {
  constructor() {
    super()
    this._dreams = {}
    this._channels = {}
    this._authKeys = {}
    this._routeCB = null
  }

  // must be called before app loads!
  boot({
    channels,
    dbConfig,
    dbSeedCB,
    dreams,
    ghostsConfig,
    inflectionsCB,
    messagesConfig,
    pathsConfig,
    projections,
    redisConfig,
    routeCB,
    telekinesisConfig,
  }) {
    this._channels = channels
    this._db = dbConfig,
    this._dbSeedCB = dbSeedCB
    this._dreams = dreams
    this._ghostsConfig = ghostsConfig
    this._inflectionsCB = inflectionsCB
    this._messagesConfig = messagesConfig
    this._pathsConfig = pathsConfig
    this._projections = projections
    this._redisConfig = redisConfig
    this._routeCB = routeCB
    this._telekinesisConfig = telekinesisConfig

    if (typeof inflectionsCB === 'function') inflectionsCB(inflector)
    transports.setConfig(messagesConfig)
    telekineticBridges.setConfig(telekinesisConfig[this.env])
    ghosts.setConfig(ghostsConfig)
  }
}

const config = global.__psychic__config || new Config()
global.__psychic__config = config

export default config
