import '../../helpers/loadEnv'
import fs from 'fs/promises'
import PsychicServer from '../../server'
import generateClientRoutes from '../../generate/client/routes'
import { clientApiPath } from '../../helpers/path'

async function syncRoutes() {
  console.log('syncing client routes...')

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
