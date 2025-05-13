import PsychicController from '../../controller/index.js'

export default class OpenApiFailedToLookupSerializerForEndpoint extends Error {
  constructor(
    private controllerClass: typeof PsychicController,
    private action: string,
  ) {
    super()
  }

  public override get message() {
    return `
The specified controller endpoint failed to lookup a corresponding serializer:

class: ${this.controllerClass.name}
action: ${this.action}
`
  }
}
