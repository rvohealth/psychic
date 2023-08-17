import sspawn from './sspawn'
import developmentOrTestEnv from './developmentOrTestEnv'
import setCoreDevelopmentFlag from './setCoreDevelopmentFlag'
import nodeOrTsnodeCmd from './nodeOrTsnodeCmd'

export async function maybeSyncRoutes(args: string[]) {
  if (developmentOrTestEnv()) {
    syncRoutes(args)
  }
}

export default async function syncRoutes(args: string[]) {
  await sspawn(nodeOrTsnodeCmd('src/bin/sync-routes.ts', args, { tsnodeFlags: ['--transpile-only'] }))
}
