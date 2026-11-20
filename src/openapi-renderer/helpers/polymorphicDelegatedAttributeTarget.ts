import { Dream, DreamApp } from '@rvoh/dream'
import {
  OpenapiDescription,
  OpenapiSchemaBody,
  OpenapiSchemaBodyShorthand,
  OpenapiShorthandPrimitiveTypes,
} from '@rvoh/dream/openapi'
import { isDeepStrictEqual } from 'node:util'
import PolymorphicDelegatedAttributeShapesDiffer from '../../error/openapi/PolymorphicDelegatedAttributeShapesDiffer.js'
import {
  declaredJSONColumnShape,
  openapiCarriesShape,
  VirtualAttributeStatement,
} from './dreamColumnOpenapiShape.js'

type DeclaredShape = OpenapiShorthandPrimitiveTypes | OpenapiSchemaBodyShorthand

interface ColumnMetadata {
  dbType: string
  isArray: boolean
  allowNull: boolean
}

interface DreamWithColumns {
  table: string
  schema: Record<string, { columns: Record<string, ColumnMetadata> }>
}

interface EncryptedAttributeStatement {
  property: string
}

type ModelDeclaration =
  | { kind: 'virtual'; shape: DeclaredShape | undefined; effectiveShape: OpenapiSchemaBody | undefined }
  | { kind: 'encrypted'; shape: DeclaredShape; effectiveShape: OpenapiSchemaBody }
  | { kind: 'json'; shape: DeclaredShape; dbType: string; isArray: boolean; allowNull: boolean }

/**
 * @internal
 *
 * Chooses the target model through which a `delegatedAttribute` across a
 * polymorphic association (more than one target model) is rendered.
 *
 * When no target declares the attribute's shape on the model (`@deco.JSON`,
 * `@deco.Virtual`, `@deco.Encrypted`), the first target is returned, as for
 * any other column. Otherwise one shape must describe every target:
 *
 * - a shape-carrying `openapi` on the `delegatedAttribute` replaces a
 *   `@deco.Virtual`/`@deco.Encrypted` declaration whole, so, when no target
 *   declares the attribute with `@deco.JSON` (which refuses a shape there),
 *   it renders alone through a target that declares the attribute
 * - else every target must declare the attribute, and the declarations must
 *   describe one shape: `@deco.JSON` declarations deeply equal, with the same
 *   array-ness; `@deco.Virtual` and `@deco.Encrypted` declarations (either
 *   decorator) with deeply equal effective shapes, the shape each renders,
 *   `null` from an `@deco.Encrypted` backing column included. Between
 *   `@deco.Encrypted` targets alone, as between json columns, nullability is
 *   not compared, whether it comes from a backing column or is declared in the
 *   shape: each effective shape is compared widened to accept `null`, and a
 *   target whose effective shape accepts `null` is preferred, so the rendered
 *   shape is nullable when any target's is, whatever the order of the targets
 *
 * Anything else throws `PolymorphicDelegatedAttributeShapesDiffer`, when the
 * serializer's OpenAPI is built (at boot, and by sync).
 */
export default function polymorphicDelegatedAttributeTarget({
  source,
  attributeName,
  associationName,
  targets,
  openapi,
}: {
  source: string
  attributeName: string
  associationName: string
  targets: (typeof Dream)[]
  openapi: OpenapiDescription | OpenapiSchemaBodyShorthand | OpenapiShorthandPrimitiveTypes | undefined
}): typeof Dream {
  const declarations = targets.map(target => modelDeclaration(target, attributeName))
  const firstDeclaringIndex = declarations.findIndex(declaration => declaration !== undefined)
  if (firstDeclaringIndex === -1) return targets[0]!

  if (openapiCarriesShape(openapi) && !declarations.some(declaration => declaration?.kind === 'json')) {
    return targets[firstDeclaringIndex]!
  }

  // beside a `@deco.Virtual` target, whose shape no column makes nullable, an
  // `@deco.Encrypted` target is compared by the shape it renders
  const compareEffectiveShapes = declarations.some(declaration => declaration?.kind === 'virtual')
  const firstDeclaration = declarations[firstDeclaringIndex]!
  const agree = declarations.every(
    declaration =>
      declaration !== undefined &&
      isDeepStrictEqual(
        comparableDeclaration(declaration, compareEffectiveShapes),
        comparableDeclaration(firstDeclaration, compareEffectiveShapes),
      ),
  )

  if (!agree)
    throw new PolymorphicDelegatedAttributeShapesDiffer(
      source,
      attributeName,
      associationName,
      targets.map((dreamClass, index) => ({
        dreamClass,
        description: describeDeclaration(declarations[index], attributeName),
      })),
    )

  const nullableIndex = declarations.findIndex(
    declaration => declaration !== undefined && acceptsNull(declaration),
  )
  return targets[nullableIndex === -1 ? 0 : nullableIndex]!
}

// whether the target renders a nullable shape: a json column by its
// nullability, a `@deco.Virtual`/`@deco.Encrypted` attribute by the shape it
// renders
function acceptsNull(declaration: ModelDeclaration): boolean {
  switch (declaration.kind) {
    case 'json':
      return declaration.allowNull
    case 'encrypted':
    case 'virtual':
      return (
        declaration.effectiveShape !== undefined &&
        DreamApp.system.openapiSchemaAcceptsNull(declaration.effectiveShape)
      )
  }
}

function modelDeclaration(dreamClass: typeof Dream, attributeName: string): ModelDeclaration | undefined {
  if (dreamClass.isVirtualColumn(attributeName)) {
    const statement = (dreamClass['virtualAttributes'] as VirtualAttributeStatement[]).find(
      virtualAttribute => virtualAttribute.property === attributeName,
    )

    const encryptedStatement = (
      dreamClass['encryptedAttributes'] as EncryptedAttributeStatement[] | undefined
    )?.find(encryptedAttribute => encryptedAttribute.property === attributeName)

    // the shape the attribute renders: for `@deco.Encrypted`, with `null`
    // added from its backing column
    const effectiveShape = DreamApp.system.declaredShapeSchema(dreamClass, attributeName)

    if (encryptedStatement && statement?.type !== undefined && effectiveShape !== undefined)
      return { kind: 'encrypted', shape: statement.type, effectiveShape }

    return { kind: 'virtual', shape: statement?.type, effectiveShape }
  }

  const shape = declaredJSONColumnShape(dreamClass, attributeName)
  if (shape === undefined) return undefined

  // `@deco.JSON` refuses at boot a property that is not a json/jsonb column,
  // so a declared shape always has its column
  const column = columnMetadata(dreamClass, attributeName)!
  return { kind: 'json', shape, dbType: column.dbType, isArray: column.isArray, allowNull: column.allowNull }
}

function columnMetadata(dreamClass: typeof Dream, column: string): ColumnMetadata | undefined {
  const dream = dreamClass.prototype as unknown as DreamWithColumns
  return dream.schema[dream.table]?.columns[column]
}

// what must be identical across targets: a json column's json-vs-jsonb
// storage does not change the shape, and its nullability is its own fact,
// unioned into the rendered shape rather than compared. `@deco.Virtual` and
// `@deco.Encrypted` declarations are compared by shape, not decorator: by the
// shape each renders when a `@deco.Virtual` target is among them, else (only
// `@deco.Encrypted` targets) by the shape each renders widened to accept
// `null`, so that nullability, from a backing column or declared, is unioned
// like a json column's
function comparableDeclaration(declaration: ModelDeclaration, compareEffectiveShapes: boolean) {
  switch (declaration.kind) {
    case 'json':
      return { kind: declaration.kind, shape: declaration.shape, isArray: declaration.isArray }
    case 'encrypted':
      return {
        kind: 'attribute',
        shape: compareEffectiveShapes ? declaration.effectiveShape : withNull(declaration.effectiveShape),
      }
    case 'virtual':
      return { kind: 'attribute', shape: declaration.effectiveShape }
  }
}

function withNull(shape: OpenapiSchemaBody) {
  return DreamApp.system.openapiSchemaAcceptsNull(shape)
    ? shape
    : DreamApp.system.openapiSchemaWithNull(shape)
}

function describeDeclaration(declaration: ModelDeclaration | undefined, attributeName: string): string {
  if (declaration === undefined)
    return `declares no @deco.JSON, @deco.Virtual or @deco.Encrypted shape for ${attributeName}`

  if (declaration.kind === 'virtual')
    return declaration.shape === undefined
      ? '@deco.Virtual with no declared shape'
      : `@deco.Virtual ${JSON.stringify(declaration.shape)}`

  if (declaration.kind === 'encrypted') {
    // the effective shape differs from the declared one when the backing
    // column adds `null` to it
    const rendered = isDeepStrictEqual(
      declaration.effectiveShape,
      DreamApp.system.expandOpenapiShorthand(declaration.shape),
    )
      ? ''
      : `, rendered as ${JSON.stringify(declaration.effectiveShape)}`
    return `@deco.Encrypted ${JSON.stringify(declaration.shape)}${rendered}`
  }

  return `@deco.JSON ${JSON.stringify(declaration.shape)} on a ${declaration.dbType} column`
}
