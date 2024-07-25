import envValue from '../../helpers/envValue'
import '../../helpers/loadEnv'
import { clientApiFileName, clientApiPath } from '../../helpers/path'
import sspawn from '../../helpers/sspawn'

async function syncOpenapiClientSchema() {
  console.log('syncing client api schema...')

  const apiPath = await clientApiPath()

  await sspawn(
    `npx openapi-typescript ${envValue('APP_ROOT_PATH')}/openapi.json -o ${apiPath}/${await clientApiFileName()}`,
  )

  console.log('done syncing client api schema!')
  process.exit()
}

void syncOpenapiClientSchema()
