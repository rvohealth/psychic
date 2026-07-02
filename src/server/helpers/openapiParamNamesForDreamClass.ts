import { Dream } from '@rvoh/dream'
import {
  DreamParamSafeAttributes,
  DreamParamSafeColumnNames,
  StrictInterface,
  UpdateableProperties,
} from '@rvoh/dream/types'
import type { VirtualAttributeStatement } from '../../openapi-renderer/helpers/dreamColumnOpenapiShape.js'
import type {
  ExtractedDreamParamSafeAttributes,
  OpenAPIDreamModelRequestBodyModifications,
} from '../params.js'
import paramNamesForDreamClass from './paramNamesForDreamClass.js'

export default function openapiParamNamesForDreamClass<
  T extends typeof Dream,
  I extends InstanceType<T>,
  const OnlyArray extends readonly (keyof DreamParamSafeAttributes<I>)[],
  const IncludingArray extends Exclude<keyof UpdateableProperties<I>, OnlyArray[number]>[],
  ForOpts extends StrictInterface<
    ForOpts,
    OpenAPIDreamModelRequestBodyModifications<OnlyArray, IncludingArray>
  >,
  ParamSafeColumnsOverride extends I['paramSafeColumns' & keyof I] extends never
    ? undefined
    : I['paramSafeColumns' & keyof I] & string[],
  ParamSafeColumns extends ParamSafeColumnsOverride extends string[] | Readonly<string[]>
    ? Extract<DreamParamSafeColumnNames<I>, ParamSafeColumnsOverride[number] & DreamParamSafeColumnNames<I>>[]
    : DreamParamSafeColumnNames<I>[],
  ParamSafeAttrs extends DreamParamSafeAttributes<InstanceType<T>>,
  ReturnPartialType extends ForOpts['only'] extends readonly (keyof DreamParamSafeAttributes<
    InstanceType<T>
  >)[]
    ? ExtractedDreamParamSafeAttributes<ParamSafeAttrs, ForOpts['only'][number] & keyof ParamSafeAttrs>
    : ExtractedDreamParamSafeAttributes<
        ParamSafeAttrs,
        ParamSafeColumns[number & keyof ParamSafeColumns] & string & keyof ParamSafeAttrs
      >,
  ReturnPartialTypeWithIncluding extends ForOpts['including'] extends readonly (keyof UpdateableProperties<
    InstanceType<T>
  >)[]
    ? ReturnPartialType &
        Partial<{
          [K in Extract<
            keyof UpdateableProperties<InstanceType<T>>,
            ForOpts['including'][number & keyof ForOpts['including']]
          >]: UpdateableProperties<InstanceType<T>>[K]
        }>
    : ReturnPartialType,
  RetArray = (keyof ReturnPartialTypeWithIncluding)[],
>(dreamClass: T, { only, including }: ForOpts = {} as ForOpts): RetArray {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let paramSafeColumns: RetArray = paramNamesForDreamClass(dreamClass, { only } as any)

  if (Array.isArray(including)) {
    paramSafeColumns = [
      ...(paramSafeColumns as string[]),

      // TODO: add a method to dream which can extrapolate
      // all of these fields from the model
      ...[
        ...dreamClass.columns(),
        ...(dreamClass['virtualAttributes'] as VirtualAttributeStatement[]).map(
          statement => statement.property,
        ),
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any
      ].filter(columnName => including.includes(columnName as any)),
    ] as RetArray
  }

  return paramSafeColumns
}
