import '../helpers/loadEnv'
import OpenapiRenderer from '../helpers/openapi-renderer'

async function syncOpenapiJson() {
  console.log('syncing openapi.json...', process.env.APP_ROOT_PATH)

  await OpenapiRenderer.syncOpenapiJsonFile()

  console.log('done syncing openapi.json!')
  process.exit()
}

void syncOpenapiJson()
