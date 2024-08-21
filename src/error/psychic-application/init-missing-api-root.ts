export default class PsychicApplicationInitMissingApiRoot extends Error {
  constructor() {
    super()
  }

  public get message() {
    return `
must set apiRoot when initializing a new PsychicApplication.

within conf/app.ts, you must have a call to "#set('apiRoot', pathToSrcDir)", i.e.


  // conf/app.ts
  export default async (app: PsychicApplication) => {
    await app.set('apiRoot', path.join(__dirname, '..')
  }
    `
  }
}
