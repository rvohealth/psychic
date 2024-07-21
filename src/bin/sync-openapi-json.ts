import '../helpers/loadEnv'
import OpenapiEndpointRenderer from '../openapi-renderer/endpoint'

async function syncOpenapiJson() {
  console.log('syncing openapi.json...', process.env.APP_ROOT_PATH)

  await OpenapiEndpointRenderer.syncOpenapiJsonFile()

  console.log('done syncing openapi.json!')
  process.exit()
}

void syncOpenapiJson()
