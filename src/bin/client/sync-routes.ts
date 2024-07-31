import '../../helpers/loadEnv'

import fs from 'fs/promises'
import generateClientRoutes from '../../generate/client/routes'
import { clientApiPath } from '../../helpers/path'
import Psyconf from '../../psyconf'
import PsychicServer from '../../server'

async function syncRoutes() {
  console.log('syncing client routes...')

  await Psyconf.configure()

  const server = new PsychicServer()
  await server.boot()

  const routes = await server.routes()
  const routeStr = generateClientRoutes(routes)

  const apiRoutesPath = (await clientApiPath()) + '/apiRoutes.ts'
  await fs.writeFile(apiRoutesPath, routeStr)

  console.log('done syncing client routes!')
  process.exit()
}

void syncRoutes()
