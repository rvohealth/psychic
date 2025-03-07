import { DreamApplication } from '@rvohealth/dream'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import inflections from './inflections'
import loadModels from './loaders/loadModels'
import loadSerializers from './loaders/loadSerializers'
import loadServices from './loaders/loadServices'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export default async function configureDream(app: DreamApplication) {
  app.set('primaryKeyType', 'bigserial')
  app.set('inflections', inflections)

  app.load('models', join(__dirname, '..', 'app', 'models'), await loadModels())
  app.load('serializers', join(__dirname, '..', 'app', 'serializers'), await loadSerializers())
  app.load('services', join(__dirname, '..', 'app', 'services'), await loadServices())

  // provides a list of path overrides for your app. This is optional, and will default
  // to the paths expected for a typical psychic application.
  app.set('paths', {
    conf: 'test-app/src/conf',
    db: 'test-app/src/db',
    types: 'test-app/src/types',
    factories: 'test-app/spec/factories',
    models: 'test-app/src/app/models',
    modelSpecs: 'test-app/spec/unit/models',
    serializers: 'test-app/src/app/serializers',
  })

  app.set('db', {
    primary: {
      user: process.env.DB_USER!,
      password: process.env.DB_PASSWORD!,
      host: process.env.DB_HOST!,
      name: process.env.DB_NAME!,
      port: parseInt(process.env.DB_PORT!),
      useSsl: process.env.DB_USE_SSL === '1',
    },
  })
}
