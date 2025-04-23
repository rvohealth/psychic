export default class PsychicAppInitMissingCallToLoadControllers extends Error {
  constructor() {
    super()
  }

  public override get message() {
    return `
must load controllers when initializing a new PsychicApp.

within conf/app.ts, you must have a call to "#load('controllers', pathToControllers)", i.e.


  // conf/app.ts
  export default async (app: PsychicApp) => {
    await app.load('controllers', path.join(__dirname, '..', 'app', 'controllers')
  }
    `
  }
}
