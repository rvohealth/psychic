export default class PsychicApplicationInitMissingAppRoot extends Error {
  constructor() {
    super()
  }

  public get message() {
    return `
must set appRoot when initializing a new PsychicApplication.

within conf/app.ts, you must have a call to "#set('appRoot', pathToSrcDir)", i.e.


  // conf/app.ts
  export default async (app: PsychicApplication) => {
    await app.set('appRoot', path.join(__dirname, '..')
  }
    `
  }
}
