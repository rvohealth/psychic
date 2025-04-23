export default class PsychicAppInitMissingApiRoot extends Error {
  constructor() {
    super()
  }

  public override get message() {
    return `
must set apiRoot when initializing a new PsychicApp.

within conf/app.ts, you must have a call to "#set('apiRoot', pathToSrcDir)", i.e.


  // conf/app.ts
  export default async (app: PsychicApp) => {
    await app.set('apiRoot', path.join(__dirname, '..')
  }
    `
  }
}
