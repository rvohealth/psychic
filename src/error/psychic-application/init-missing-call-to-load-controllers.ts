export default class PsychicApplicationInitMissingCallToLoadControllers extends Error {
  constructor() {
    super()
  }

  public get message() {
    return `
must load controllers when initializing a new PsychicApplication.

within conf/app.ts, you must have a call to "#load('controllers', pathToControllers)", i.e.


  // conf/app.ts
  export default async (app: PsychicApplication) => {
    await app.load('controllers', path.join(__dirname, '..', 'app', 'controllers')
  }
    `
  }
}
