export default class CannotFindInferredControllerFromProvidedNamespace extends Error {
  private expectedPath: string
  private httpMethod: string
  private path: string
  private controllerName: string
  private action: string

  constructor({
    expectedPath,
    httpMethod,
    path,
    controllerName,
    action,
  }: {
    expectedPath: string
    httpMethod: string
    path: string
    controllerName: string
    action: string
  }) {
    super()
    this.expectedPath = expectedPath
    this.httpMethod = httpMethod
    this.controllerName = controllerName
    this.path = path
    this.action = action
  }

  public override get message() {
    return `
ATTENTION!

An error has occurred while parsing the conf/routes.ts
file within your application. The error is:

  cannot find inferred controller from provided namespace
    HTTP method: ${this.httpMethod}
    path: ${this.path}
    expected file path for controller: ${this.expectedPath}
    expected action on controller: ${this.action}

  We recommend that you either:

    A)
      Explicitly provide a controller to your route:
        // conf/app.ts
        r.${this.httpMethod}('${this.path}', ${this.controllerName}, '${this.action}')

    B)
      Ensure that a controller exists at ${this.expectedPath} with the action "${this.action}"
    `
  }
}
