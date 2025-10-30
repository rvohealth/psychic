import { ViewModelClass } from '@rvoh/dream/types'

export default class OpenapiDecoratorModelMissingSerializer extends Error {
  constructor(
    private modelClass: ViewModelClass,
    private serializerKey: string,
  ) {
    super()
  }

  public override get message() {
    return `
The specified class does not have a serializer for the specified serializer key:

class: ${this.modelClass.name}
serializer key: ${this.serializerKey.toString()}
`
  }
}
