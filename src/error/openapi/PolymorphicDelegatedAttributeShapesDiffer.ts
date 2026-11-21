import { Dream } from '@rvoh/dream'

/**
 * @internal
 *
 * One target model's declaration for a delegated attribute, described for
 * {@link PolymorphicDelegatedAttributeShapesDiffer}'s message.
 */
export interface PolymorphicDelegatedAttributeTargetDescription {
  dreamClass: typeof Dream
  description: string
}

/**
 * Thrown while rendering OpenAPI (so at boot, and by sync) when a serializer
 * `delegatedAttribute` reaches a model-declared shape (`@deco.JSON`,
 * `@deco.Virtual`, `@deco.Encrypted`) through a polymorphic association whose
 * target models do not all declare that attribute identically: a declaration
 * differs, a json column is an array on one target and not on another, or a
 * target does not declare the attribute at all. Not exported: an application
 * fixes the declarations rather than catching this.
 */
export default class PolymorphicDelegatedAttributeShapesDiffer extends Error {
  constructor(
    private source: string,
    private attributeName: string,
    private associationName: string,
    private targets: PolymorphicDelegatedAttributeTargetDescription[],
  ) {
    super()
  }

  public override get message() {
    const targetLines = this.targets
      .map(target => `  ${target.dreamClass.sanitizedName}: ${target.description}`)
      .join('\n')

    return `
${this.source} delegates "${this.attributeName}" through the polymorphic
association "${this.associationName}", but its target models do not declare
"${this.attributeName}" identically:

${targetLines}

A delegated attribute renders one OpenAPI shape, so every target model must
declare the identical shape (and, for a json column, all or none of the
columns must be arrays). Declare the same shape on every target model, or,
for a @deco.Virtual or @deco.Encrypted attribute, pass the shape to this
delegatedAttribute's \`openapi\` option.`
  }
}
