export default class PsychicAppInitMissingRoutesCallback extends Error {
  constructor() {
    super()
  }

  public override get message() {
    return `
must set routes when initializing a new PsychicApp.

within conf/app.ts, you must have a call to "#set('routes', routesCb)", i.e.


  // conf/app.ts
  import routes from './routes.js'

  export default async (app: PsychicApp) => {
    await app.set('routes', routes)
  }
    `
  }
}
