import { Dreamconf } from 'dream'
import SyncedAssociationsVal, {
  SyncedAssociations,
  SyncedBelongsToAssociations,
  VirtualColumns,
} from '../db/associations'
import { DBClass, DBColumns, DBTypeCache, InterpretedDBClass } from '../db/schema'

const dreamconf = new Dreamconf<
  DBClass,
  InterpretedDBClass,
  SyncedAssociations,
  SyncedBelongsToAssociations,
  VirtualColumns,
  typeof DBColumns,
  typeof DBTypeCache
>({
  DB: new DBClass(),
  interpretedDB: new InterpretedDBClass(),
  syncedAssociations: SyncedAssociationsVal as SyncedAssociations,
  syncedBelongsToAssociations: {} as SyncedBelongsToAssociations,
  virtualColumns: {} as VirtualColumns,
  dbColumns: DBColumns,
  dbTypeCache: DBTypeCache,
  env: {
    db: {
      development: {
        primary: {
          user: 'DB_USER',
          password: 'DB_PASSWORD',
          host: 'DB_HOST',
          name: 'DB_NAME',
          port: 'DB_PORT',
          use_ssl: 'DB_USE_SSL',
        },
        replica: {
          user: 'DB_USER',
          password: 'DB_PASSWORD',
          host: 'REPLICA_DB_HOST',
          name: 'REPLICA_DB_NAME',
          port: 'DB_PORT',
          use_ssl: 'DB_USE_SSL',
        },
      },
      test: {
        primary: {
          user: 'DB_USER',
          password: 'DB_PASSWORD',
          host: 'DB_HOST',
          name: 'DB_NAME',
          port: 'DB_PORT',
          use_ssl: 'DB_USE_SSL',
        },
        replica: {
          user: 'DB_USER',
          password: 'DB_PASSWORD',
          host: 'REPLICA_DB_HOST',
          name: 'REPLICA_DB_NAME',
          port: 'DB_PORT',
          use_ssl: 'DB_USE_SSL',
        },
      },
      production: {
        primary: {
          user: 'DB_USER',
          password: 'DB_PASSWORD',
          host: 'DB_HOST',
          name: 'DB_NAME',
          port: 'DB_PORT',
          use_ssl: 'DB_USE_SSL',
        },
        replica: {
          user: 'DB_USER',
          password: 'DB_PASSWORD',
          host: 'REPLICA_DB_HOST',
          name: 'REPLICA_DB_NAME',
          port: 'DB_PORT',
          use_ssl: 'DB_USE_SSL',
        },
      },
    },
  },
})

export default dreamconf
