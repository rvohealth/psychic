import sspawn from '../../../src/helpers/sspawn'
import setCoreDevelopmentFlag from './setCoreDevelopmentFlag'

export async function maybeSyncRoutes(args: string[]) {
  if (['development', 'test'].includes(process.env.NODE_ENV || '')) {
    syncRoutes(args)
  }
}

export default async function syncRoutes(args: string[]) {
  const coreDevFlag = setCoreDevelopmentFlag(args)
  await sspawn(`${coreDevFlag}ts-node --transpile-only ./bin/sync-routes.ts`)
}
