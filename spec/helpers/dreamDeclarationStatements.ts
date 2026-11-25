import type { OpenapiSchemaBodyShorthand, OpenapiShorthandPrimitiveTypes } from '@rvoh/dream/openapi'

// The records Dream keeps on a model class for its declarations: `@deco.JSON`
// in `jsonColumnShapes`, `@deco.Virtual` and `@deco.Encrypted` in
// `virtualAttributes`. A spec writes them on a subclass to stand in for a
// declaration the test-app does not make, or for one that got past Dream's
// types and boot checks. Psychic itself never reads them: it asks Dream,
// through `DreamApp.system`.

export interface JSONColumnShapeStatement {
  column: string
  openapi: OpenapiShorthandPrimitiveTypes | OpenapiSchemaBodyShorthand
}

export interface VirtualAttributeStatement {
  property: string
  type: OpenapiShorthandPrimitiveTypes | OpenapiSchemaBodyShorthand | undefined
}
