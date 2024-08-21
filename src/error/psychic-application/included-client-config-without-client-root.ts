export default class IncludedClientConfigWithoutClientRoot extends Error {
  constructor() {
    super()
  }

  public get message() {
    return `
must set clientRoot when initializing a PsychicApplication with client config.

within conf/app.ts, you must have a call to "#set('clientRoot', pathToSrcDir)", i.e.


  // conf/app.ts
  export default async (app: PsychicApplication) => {
    await app.set('clientRoot', path.join(__dirname, '..', '..', '..', '..', 'client')
  }
    `
  }
}
