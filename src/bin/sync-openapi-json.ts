import envValue from '../helpers/envValue'
import '../helpers/loadEnv'
import OpenapiAppRenderer from '../openapi-renderer/app'

async function syncOpenapiJson() {
  console.log('syncing openapi.json...', envValue('APP_ROOT_PATH'))

  await OpenapiAppRenderer.sync()

  console.log('done syncing openapi.json!')
  process.exit()
}

void syncOpenapiJson()
