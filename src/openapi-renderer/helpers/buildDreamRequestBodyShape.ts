/* eslint-disable @typescript-eslint/no-explicit-any */
import { Dream } from '@rvoh/dream'
import { OpenapiSchemaBody, OpenapiSchemaObject, OpenapiSchemaProperties } from '@rvoh/dream/openapi'
import openapiParamNamesForDreamClass from '../../server/helpers/openapiParamNamesForDreamClass.js'
import { dreamColumnOpenapiShape } from './dreamColumnOpenapiShape.js'

export interface BuildDreamRequestBodyShapeOpts {
  params?: readonly string[] | undefined
  only?: readonly string[] | undefined
  including?: readonly string[] | undefined
  required?: readonly string[] | undefined
  combining?: Record<string, unknown> | undefined

  /**
   * When true, restores the legacy behavior of resolving to ALL param-safe
   * columns when no `params`/`only` are provided. When false/undefined (the
   * default), an absent `params`/`only` resolves to NO model columns, so that
   * database-level structure is not implicitly leaked into the OpenAPI shape.
   */
  legacyImplicitRequestBodyParams?: boolean | undefined
}

/**
 * @internal
 *
 * Builds an unexpanded `OpenapiSchemaObject` for a Dream model's request-body shape,
 * resolving param-safe columns, attaching `required`, and merging `combining` entries.
 *
 * Used by both the top-level model-driven `requestBody` path in `OpenapiEndpointRenderer`
 * and the `$dream` sentinel expansion inside `OpenapiSegmentExpander`. Single source of
 * truth keeps top-level and nested semantics identical.
 */
export default function buildDreamRequestBodyShape(
  dreamClass: typeof Dream,
  opts: BuildDreamRequestBodyShapeOpts,
  source: string,
): OpenapiSchemaObject {
  const { params, only, including, required, combining, legacyImplicitRequestBodyParams } = opts

  // When neither `params` nor `only` is provided, the default is to resolve to
  // NO model columns (an empty allowlist), rather than implicitly exposing every
  // param-safe column. The legacy implicit-all behavior can be re-activated via
  // the `legacyImplicitRequestBodyParams` opt-in.
  const resolvedOnly = params ?? only
  const onlyForResolution = resolvedOnly === undefined && !legacyImplicitRequestBodyParams ? [] : resolvedOnly

  const paramSafeColumns = openapiParamNamesForDreamClass(dreamClass, {
    only: onlyForResolution,
    including,
  } as any)

  const paramsShape: OpenapiSchemaObject = {
    type: 'object',
    properties: {},
  }

  if (required) {
    paramsShape.required = required as string[]
  }

  paramsShape.properties = paramSafeColumns.reduce(
    (acc, columnName) => {
      acc[columnName] = dreamColumnOpenapiShape(source, dreamClass, columnName, undefined, {
        allowGenericJson: true,
      })
      return acc
    },
    paramsShape.properties as Record<string, OpenapiSchemaBody>,
  )

  paramsShape.properties = {
    ...paramsShape.properties,
    ...((combining || {}) as OpenapiSchemaProperties),
  }

  return paramsShape
}
