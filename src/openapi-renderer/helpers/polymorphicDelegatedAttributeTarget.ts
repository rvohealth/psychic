import { Dream } from '@rvoh/dream'
import {
  OpenapiDescription,
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

interface DreamWithColumns {
  table: string
  schema: Record<
    string,
    { columns: Record<string, { dbType: string; isArray: boolean; allowNull: boolean }> }
  >
}

type ModelDeclaration =
  | { kind: 'virtual'; shape: DeclaredShape | undefined }
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
 * - else every target must declare the attribute, with deeply equal
 *   declarations of the same kind and, for a json column, the same
 *   array-ness; a nullable target column is preferred, so the rendered shape
 *   is nullable when any target's column is, whatever the order of the targets
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

  const firstDeclaration = declarations[firstDeclaringIndex]!
  const agree = declarations.every(
    declaration =>
      declaration !== undefined &&
      isDeepStrictEqual(comparableDeclaration(declaration), comparableDeclaration(firstDeclaration)),
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
    declaration => declaration?.kind === 'json' && declaration.allowNull,
  )
  return targets[nullableIndex === -1 ? 0 : nullableIndex]!
}

function modelDeclaration(dreamClass: typeof Dream, attributeName: string): ModelDeclaration | undefined {
  if (dreamClass.isVirtualColumn(attributeName)) {
    const statement = (dreamClass['virtualAttributes'] as VirtualAttributeStatement[]).find(
      virtualAttribute => virtualAttribute.property === attributeName,
    )
    return { kind: 'virtual', shape: statement?.type }
  }

  const shape = declaredJSONColumnShape(dreamClass, attributeName)
  if (shape === undefined) return undefined

  // `@deco.JSON` refuses at boot a property that is not a json/jsonb column,
  // so a declared shape always has its column
  const dream = dreamClass.prototype as unknown as DreamWithColumns
  const column = dream.schema[dream.table]!.columns[attributeName]!
  return { kind: 'json', shape, dbType: column.dbType, isArray: column.isArray, allowNull: column.allowNull }
}

// what must be identical across targets: a json column's nullability is its
// own fact, unioned into the rendered shape rather than compared, and its
// json-vs-jsonb storage does not change the shape
function comparableDeclaration(declaration: ModelDeclaration) {
  return declaration.kind === 'json'
    ? { kind: declaration.kind, shape: declaration.shape, isArray: declaration.isArray }
    : declaration
}

function describeDeclaration(declaration: ModelDeclaration | undefined, attributeName: string): string {
  if (declaration === undefined)
    return `declares no @deco.JSON, @deco.Virtual or @deco.Encrypted shape for ${attributeName}`

  if (declaration.kind === 'virtual')
    return declaration.shape === undefined
      ? '@deco.Virtual/@deco.Encrypted with no declared shape'
      : `@deco.Virtual/@deco.Encrypted ${JSON.stringify(declaration.shape)}`

  return `@deco.JSON ${JSON.stringify(declaration.shape)} on a ${declaration.dbType} column`
}
