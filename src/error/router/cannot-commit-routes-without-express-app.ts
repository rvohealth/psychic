export default class CannotCommitRoutesWithoutExpressApp extends Error {
  public override get message() {
    return `
      When instantiating a PsychicRouter, if no express app is provided as the
      first argument, you are not able to commit your routes. Make sure
      to provide an actual express app before commiting, like so:

        const app = express()
        new PsychicRouter(app, ...)
    `
  }
}
