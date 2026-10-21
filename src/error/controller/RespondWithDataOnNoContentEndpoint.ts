import type PsychicController from '../../controller/index.js'

/**
 * @internal
 *
 * Thrown by `this.respond(...)` when it is given data (anything but an
 * omitted or `undefined` argument, so `null` counts) on an endpoint where
 * the success status it sends (see `OpenapiEndpointRenderer#respondStatus`)
 * is the 204 No Content the endpoint's `@OpenAPI` decorator documents. A 204
 * cannot carry a body, so sending it would silently drop the data. Not
 * exported: it signals a mistake in the app's code, which no working
 * application throws or catches.
 */
export default class RespondWithDataOnNoContentEndpoint extends Error {
  constructor(
    private controllerClass: typeof PsychicController,
    private action: string,
  ) {
    super()
  }

  public override get message() {
    return `
\`this.respond(...)\` was given data, but this endpoint's \`@OpenAPI\` decorator
documents its success response as a 204 No Content, which cannot carry a body.

controller: ${this.controllerClass.name}
action: ${this.action}

To answer 204, call \`this.respond()\` with no data, or \`this.noContent()\`.
To send the data, document a success response that carries it in the
endpoint's \`@OpenAPI\` decorator, e.g. by passing a model, view model or
serializer, or by declaring the response in \`responses\`.
`
  }
}
