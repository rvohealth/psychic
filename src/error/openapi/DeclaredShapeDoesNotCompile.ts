import { Dream } from '@rvoh/dream'

/**
 * Thrown while `PsychicApp.init` runs when a shape a model declares
 * (`@deco.JSON`, or an object or composition `@deco.Virtual`/`@deco.Encrypted`
 * shape) renders as OpenAPI but AJV cannot compile it into the validator
 * `Params.for` checks a request value with: a `pattern` that is not a valid
 * regular expression under the `u` flag, a union `type` array, a keyword
 * where a schema belongs, and so on. Not exported: an application fixes the
 * declaration rather than catching this.
 */
export default class DeclaredShapeDoesNotCompile extends Error {
  constructor(
    private dreamClass: typeof Dream,
    private property: string,
    private decorator: '@deco.JSON' | '@deco.Virtual' | '@deco.Encrypted',
    private ajvMessage: string,
    options?: ErrorOptions,
  ) {
    super(undefined, options)
  }

  public override get message() {
    return `
${this.dreamClass.sanitizedName} declares a shape for "${this.property}" with
${this.decorator} that cannot be compiled into the validator Params.for checks
a request value with. The validator (JSON Schema 2020-12, strict types) failed
to compile with:

  ${this.ajvMessage}

Declare a shape that compiles: write a \`pattern\` that is a valid regular
expression under the \`u\` flag (escape only characters that need escaping),
use \`anyOf\` rather than a \`type\` array to admit more than one non-null
type, and
give \`properties\` a map of property names to shapes.`
  }
}
