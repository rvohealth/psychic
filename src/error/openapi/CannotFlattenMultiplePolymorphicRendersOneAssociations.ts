import { DreamSerializer } from '@rvoh/dream'

// We can't support multiple polymorphic RendersOne associations at the openapi level
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
Each serializer may only include a single flattened polymorphic RendersOne.

Serializer class: ${this.serializerClass.name}
association: ${this.associationName}
`
  }
}
