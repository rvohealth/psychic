import '../helpers/loadEnv'
import path from 'path'
import fs from 'fs/promises'
import PsychicServer from '../server'
import { compact } from 'dream'
;(async function () {
  console.log('syncing routes...')

  const server = new PsychicServer()
  await server.boot()

  const routes = await server.routes()
  const fileStr = `\
  export type RouteTypes =
  ${routes.map(routeConf => `  | '/${routeConf.path.replace(/^\//, '')}'`).join('\n')}
  `

  const filePath = path.join(
    ...compact([
      // __dirname,
      // '..',
      process.cwd(),
      process.env.PSYCHIC_OMIT_DIST_FOLDER === '1' || process.env.TS_SAFE === '1' ? null : 'dist',
      'src',
      'sync',
      'routes',
    ])
  )
  await fs.writeFile(filePath, fileStr)

  console.log('done syncing routes!')
  process.exit()
})()
