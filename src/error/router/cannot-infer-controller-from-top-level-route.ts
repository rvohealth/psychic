export default class CannotInferControllerFromTopLevelRouteError extends Error {
  constructor(
    private httpMethod: string,
    private path: string,
    private controllerName: string,
    private action: string,
  ) {
    super()
  }

  public get message() {
    return `
ATTENTION!

An error has occurred while parsing the conf/routes.ts
file within your application. The error is:

  cannot infer controller from top level route:
    HTTP method: ${this.httpMethod}
    path: ${this.path}

  in your conf/routes.ts file, instead of this:
    r.${this.httpMethod}('${this.path}')

  try this:
    r.resources('users', r => {
      r.${this.httpMethod}('${this.path}')
    })

  or else, manually pass a controller and method to match up with your route, like so:
    r.${this.httpMethod}('${this.path}', ${this.controllerName}, '${this.action}')
    `
  }
}
