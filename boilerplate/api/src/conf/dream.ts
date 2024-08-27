import { DreamApplication } from '@rvohealth/dream'
import path from 'path'
import { productionEnv } from '../helpers/environment'
import inflections from './inflections'

export default async function (app: DreamApplication) {
  app.set('projectRoot', path.join(__dirname, '..', '..'))
  app.set('primaryKeyType', <PRIMARY_KEY_TYPE>)
  app.set('inflections', inflections)

  await app.load('models', path.join(__dirname, '..', 'app', 'models'))
  await app.load('serializers', path.join(__dirname, '..', 'app', 'serializers'))
  await app.load('services', path.join(__dirname, '..', 'app', 'services'))

  app.set('paths', {})

  app.set('db', {
    primary: {
      user: process.env.DB_USER!,
      password: process.env.DB_PASSWORD!,
      host: process.env.DB_HOST!,
      name: process.env.DB_NAME!,
      port: parseInt(process.env.DB_PORT!),
      useSsl: process.env.DB_USE_SSL === '1',
    },
    replica: productionEnv()
      ? {
          user: process.env.DB_USER!,
          password: process.env.DB_PASSWORD!,
          host: process.env.READER_DB_HOST!,
          name: process.env.DB_NAME!,
          port: parseInt(process.env.READER_DB_PORT!),
          useSsl: process.env.DB_USE_SSL === '1',
        }
      : undefined,
  })
}
