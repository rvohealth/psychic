import { Dream } from '@rvoh/dream'

/**
 * Thrown while rendering OpenAPI (so at boot, and by sync) when a model-derived
 * request body's `combining` has an entry for a column whose shape the model
 * declares with `@deco.JSON`. Not exported: an application fixes the
 * declaration rather than catching this.
 */
export default class RequestBodyCombiningRedeclaresJSONColumn extends Error {
  constructor(
    private source: string,
    private dreamClass: typeof Dream,
    private column: string,
  ) {
    super()
  }

  public override get message() {
    const modelName = this.dreamClass.sanitizedName
    return `
The request body of ${this.source} has a \`combining\` entry for
${modelName}#${this.column}, but ${modelName} declares that column's shape
with @deco.JSON.

The @deco.JSON declaration is the column's single shape: request bodies render
it, and Params.for enforces it whatever the endpoint's OpenAPI says.

Remove '${this.column}' from \`combining\` (list it in \`params\` or \`only\`
to render the declared shape), or change the @deco.JSON declaration on
${modelName}.`
  }
}
