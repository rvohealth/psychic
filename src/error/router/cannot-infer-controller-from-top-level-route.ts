export default class CannotInferControllerFromTopLevelRouteError extends Error {
  constructor(
    private httpMethod: string,
    private path: string,
  ) {
    super()
  }

  public get message() {
    return `
cannot infer controller from top level route:
  HTTP method: ${this.httpMethod}
  path: ${this.path}

within conf/app.ts, you must have a call to "#load('controllers', pathToControllers)", i.e.

  // in your conf/routes.ts file, instead of this:
  router.get('/doesnt-exist')

  // try this:
  router.resources('users', r => {
    r.get('/doesnt-exist')
  })
    `
  }
}
