import { Dream } from '@rvoh/dream'
import { DreamParamSafeAttributes, DreamParamSafeColumnNames } from '@rvoh/dream/types'
import { ParamsForOpts } from '../params.js'

export default function paramNamesForDreamClass<
  T extends typeof Dream,
  I extends InstanceType<T>,
  const OnlyArray extends readonly (keyof DreamParamSafeAttributes<I>)[],
  ForOpts extends ParamsForOpts<OnlyArray> & { key?: string },
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
    ? Partial<{
        [K in ForOpts['only'][number] & keyof ParamSafeAttrs]: ParamSafeAttrs[K & keyof ParamSafeAttrs]
      }>
    : Partial<{
        [K in ParamSafeColumns[number & keyof ParamSafeColumns] & string]: DreamParamSafeAttributes<
          InstanceType<T>
        >[K & keyof DreamParamSafeAttributes<InstanceType<T>>]
      }>,
  RetArray = (keyof ReturnPartialType)[],
>(dreamClass: T, { only }: ForOpts = {} as ForOpts): RetArray {
  return Array.isArray(only)
    ? ((dreamClass.paramSafeColumnsOrFallback() as string[]).filter(column =>
        only.includes(column as (typeof only)[number]),
      ) as unknown as RetArray)
    : (dreamClass.paramSafeColumnsOrFallback() as string[] as RetArray)
}
