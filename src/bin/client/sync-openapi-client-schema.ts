import '../../helpers/loadEnv'

import envValue from '../../helpers/envValue'
import { clientApiFileName, clientApiPath } from '../../helpers/path'
import sspawn from '../../helpers/sspawn'
import Psyconf from '../../psyconf'

async function syncOpenapiClientSchema() {
  console.log('syncing client api schema...')

  await Psyconf.configure()

  const apiPath = await clientApiPath()

  await sspawn(
    `npx openapi-typescript ${envValue('APP_ROOT_PATH')}/openapi.json -o ${apiPath}/${await clientApiFileName()}`,
  )

  console.log('done syncing client api schema!')
  process.exit()
}

void syncOpenapiClientSchema()
