// We can't support multiple polymorphic RendersOne associations at the openapi level

import { DreamSerializer } from '@rvohealth/dream'

// because the resulting openapi types will be combinatorially inflated.
export default class CannotFlattenMultiplePolymorphicRendersOneAssociations extends Error {
  constructor(
    private serializerClass: typeof DreamSerializer,
    private associationName: string,
  ) {
    super()
  }

  public get message() {
    return `
When designing your serializers, you may only include a single flattened polymorphic RendersOne
per serializer class.

Serializer class: ${this.serializerClass.name}
association: ${this.associationName}
`
  }
}
