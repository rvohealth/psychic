import '../helpers/loadEnv'
import openapiJsonPath from '../helpers/openapiJsonPath'
import OpenapiAppRenderer from '../openapi-renderer/app'
import Psyconf from '../psyconf'

async function syncOpenapiJson() {
  await Psyconf.configure()

  console.log(`syncing ${openapiJsonPath()}...`)

  await OpenapiAppRenderer.sync()

  console.log(`done syncing ${openapiJsonPath()}!`)
  process.exit()
}

void syncOpenapiJson()
