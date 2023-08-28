import '../helpers/loadEnv'
import path from 'path'
import fs from 'fs/promises'
import PsychicServer from '../server'
import { compact } from 'dream'
import absoluteSrcPath from '../helpers/absoluteSrcPath'
import psychicRootPath from '../config/helpers/psychicRootPath'
;(async function () {
  console.log('syncing routes...')

  const server = new PsychicServer()
  await server.boot()

  const routes = await server.routes()
  const fileStr = `\
  export type RouteTypes =
  ${routes.map(routeConf => `  | '/${routeConf.path.replace(/^\//, '')}'`).join('\n')}
  `

  const filePath = psychicRootPath({ filepath: 'src/sync/routes' })
  console.log('ROOT PATH:', filePath)
  await fs.writeFile(filePath, fileStr)

  console.log('done syncing routes!')
  process.exit()
})()
