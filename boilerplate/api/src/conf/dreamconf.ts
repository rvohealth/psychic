import { Dreamconf } from '@rvohealth/dream'
import { DBClass } from '../db/sync'
import { schema } from '../db/schema'

const dreamconf = new Dreamconf<DBClass, typeof schema>({
  DB: new DBClass(),
  schema,
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
        // replica: {
        //   user: 'DB_USER',
        //   password: 'DB_PASSWORD',
        //   host: 'REPLICA_DB_HOST',
        //   name: 'REPLICA_DB_NAME',
        //   port: 'DB_PORT',
        //   use_ssl: 'DB_USE_SSL',
        // },
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
        // replica: {
        //   user: 'DB_USER',
        //   password: 'DB_PASSWORD',
        //   host: 'REPLICA_DB_HOST',
        //   name: 'REPLICA_DB_NAME',
        //   port: 'DB_PORT',
        //   use_ssl: 'DB_USE_SSL',
        // },
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
          host: 'READER_DB_HOST',
          name: 'DB_NAME',
          port: 'READER_DB_PORT',
          use_ssl: 'DB_USE_SSL',
        },
      },
    },
  },
})

export default dreamconf
