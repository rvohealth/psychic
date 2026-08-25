/**
 * @internal
 *
 * Collects the pg-enum-backed values that are actually rendered into an
 * OpenAPI document while it is being built in memory.
 *
 * An instance is threaded through `OpenapiRenderOpts` into every render
 * surface that reaches `dreamColumnOpenapiShape` (serializer attributes,
 * model-derived request bodies, and nested `for:` sentinels), which calls
 * {@link collect} with the column's pg type name and the spec-visible value
 * set each time an enum-backed Dream column is rendered.
 *
 * Collection is upstream of `suppressResponseEnums` (suppressed specs still
 * collect their real values) and downstream of serializer `enum:` overrides
 * (values hidden by an override are never collected from that site). When
 * the same pg enum is rendered at several sites, the collected set is the
 * union of the values those sites render.
 *
 * The collector is side-effect-free on the rendered document: it only reads
 * the values handed to it, copying them into its own storage, and never
 * mutates the shared in-memory Dream schema arrays.
 */
export default class OpenapiEnumCollector {
  private collected: Map<string, Set<string>> = new Map()

  /**
   * Records the spec-visible values rendered for an enum-backed Dream column.
   *
   * @param dbType - the column's pg type name (a trailing `[]` marking an
   * array column is stripped)
   * @param values - the values the spec renders at this site (never the
   * `null`-augmented rendered array)
   */
  public collect(dbType: string, values: readonly (string | null)[]): void {
    const enumName = dbType.replace('[]', '')

    let valueSet = this.collected.get(enumName)
    if (!valueSet) {
      valueSet = new Set()
      this.collected.set(enumName, valueSet)
    }

    for (const value of values) {
      if (typeof value === 'string') valueSet.add(value)
    }
  }

  /**
   * Returns the collected enums as `{ [pgEnumName]: sortedValues }`, with
   * enum names and values alphabetically sorted. The returned arrays are
   * fresh copies, never references into the Dream schema.
   */
  public toEnumMap(): Record<string, string[]> {
    const enumMap: Record<string, string[]> = {}

    for (const enumName of [...this.collected.keys()].sort()) {
      enumMap[enumName] = [...(this.collected.get(enumName) ?? [])].sort()
    }

    return enumMap
  }
}
