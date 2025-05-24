import { inspect } from 'node:util'
import PsychicController from '../../controller/index.js'

export default class NonSerializerDerivedInOpenapiEndpointRenderer extends Error {
  constructor(
    private controllerClass: typeof PsychicController,
    private action: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private serializer: any,
  ) {
    super()
  }

  public override get message() {
    return `
The specified controller endpoint derived a non-function for the serializer:

class: ${this.controllerClass.name}
action: ${this.action}
serializer: ${inspect(this.serializer)}
`
  }
}
