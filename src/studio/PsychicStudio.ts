import EnvInternal from '../helpers/EnvInternal.js'
import PsychicRouter from '../router/index.js'
import PsychicStudioTablesController from './PsychicStudioTablesController.js'

export default class PsychicStudio {
  public static addStudioRoutes(router: PsychicRouter, namespace: string) {
    // never allow studio outside development environments, since all
    // routes are unprotected
    if (!EnvInternal.isDevelopment) return

    router.get(studioRoute(namespace, 'tables'), PsychicStudioTablesController, 'index')
    router.post(studioRoute(namespace, 'tables/:tableName'), PsychicStudioTablesController, 'show')
    router.post(studioRoute(namespace, 'tables/:tableName'), PsychicStudioTablesController, 'create')
    router.patch(studioRoute(namespace, 'tables/:tableName'), PsychicStudioTablesController, 'update')
  }
}

function studioRoute(namespace: string, route: string) {
  return `/${namespace.replace(/^\//, '').replace(/\/$/, '')}/${route.replace(/^\//, '')}`
}
