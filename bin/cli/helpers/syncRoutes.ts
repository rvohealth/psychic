import sspawn from '../../../src/helpers/sspawn'
import developmentOrTestEnv from './developmentOrTestEnv'
import setCoreDevelopmentFlag from './setCoreDevelopmentFlag'

export async function maybeSyncRoutes(args: string[]) {
  if (developmentOrTestEnv()) {
    syncRoutes(args)
  }
}

export default async function syncRoutes(args: string[]) {
  const coreDevFlag = setCoreDevelopmentFlag(args)
  await sspawn(`${coreDevFlag}ts-node --transpile-only ./bin/sync-routes.ts`)
}
