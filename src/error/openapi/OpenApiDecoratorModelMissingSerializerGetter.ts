import { ViewModelClass } from '@rvoh/dream'

export default class OpenapiDecoratorModelMissingSerializerGetter extends Error {
  constructor(private modelClass: ViewModelClass) {
    super()
  }

  public override get message() {
    return `
Model passed to @OpenAPI decorator is missing a serializers getter:

class: ${this.modelClass.name}
`
  }
}
