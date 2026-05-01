/* eslint-disable @typescript-eslint/no-explicit-any */
import { Dream } from '@rvoh/dream'
import { OpenapiSchemaBody, OpenapiSchemaObject, OpenapiSchemaProperties } from '@rvoh/dream/openapi'
import openapiParamNamesForDreamClass from '../../server/helpers/openapiParamNamesForDreamClass.js'
import { dreamColumnOpenapiShape } from './dreamColumnOpenapiShape.js'

export interface BuildDreamRequestBodyShapeOpts {
  only?: readonly string[] | undefined
  including?: readonly string[] | undefined
  required?: readonly string[] | undefined
  combining?: Record<string, unknown> | undefined
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
  const { only, including, required, combining } = opts

  const paramSafeColumns = openapiParamNamesForDreamClass(dreamClass, { only, including } as any)

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
