export default class CannotCommitRoutesWithoutKoaApp extends Error {
  public override get message() {
    return `
      When instantiating a PsychicRouter, if no Koa app is provided as the
      first argument, you are not able to commit your routes. Make sure
      to provide an actual Koa app before commiting, like so:

        const app = new Koa()
        new PsychicRouter(app, ...)
    `
  }
}
