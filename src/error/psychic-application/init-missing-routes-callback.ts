export default class PsychicApplicationInitMissingRoutesCallback extends Error {
  constructor() {
    super()
  }

  public get message() {
    return `
must set routes when initializing a new PsychicApplication.

within conf/app.ts, you must have a call to "#set('routes', routesCb)", i.e.


  // conf/app.ts
  import routes from './routes.js'

  export default async (app: PsychicApplication) => {
    await app.set('routes', routes)
  }
    `
  }
}
