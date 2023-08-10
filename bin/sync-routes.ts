import path from 'path'
import fs from 'fs/promises'
import env from '../src/env'
import PsychicServer from '../src/server'

env.load()
;(async function () {
  console.log('syncing routes...')

  const server = new PsychicServer()
  await server.boot()

  const routes = await server.routes()
  const fileStr = `\
export type RouteTypes =
${routes.map(routeConf => `  | '/${routeConf.path.replace(/^\//, '')}'`).join('\n')}
`

  const filePath = path.join(__dirname, '..', 'src', 'sync', 'routes.ts')
  await fs.writeFile(filePath, fileStr)

  console.log('done syncing routes!')
  process.exit()
})()
