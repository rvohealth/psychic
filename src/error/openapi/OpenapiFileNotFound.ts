export default class OpenapiFileNotFound extends Error {
  constructor(
    private openapiName: string,
    private openapiPath: string,
  ) {
    super()
  }

  public override get message() {
    return `
      Failed to read openapi file during psychic app initialization.

        openapiName: ${this.openapiName}
        openapi file path: ${this.openapiPath}

      Typically, this occurs when you build your application to production,
      but fail to copy over your openapi json files as part of the production
      build. Be sure that your "build" script in your package.json correctly
      copies the openapi dir over, e.g.

        "build": "... && cp -R ./${this.openapiPath} ./dist/${this.openapiPath}"
    `
  }
}
