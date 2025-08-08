import { Dream, DreamParamSafeAttributes, DreamParamSafeColumnNames, UpdateableProperties } from '@rvoh/dream'
import { VirtualAttributeStatement } from '../../openapi-renderer/helpers/dreamAttributeOpenapiShape.js'
import { ParamsForOpts } from '../params.js'

export default function paramNamesForDreamClass<
  T extends typeof Dream,
  I extends InstanceType<T>,
  const OnlyArray extends readonly (keyof DreamParamSafeAttributes<I>)[],
  const IncludingArray extends Exclude<keyof UpdateableProperties<I>, OnlyArray[number]>[],
  ForOpts extends ParamsForOpts<OnlyArray, IncludingArray> & { key?: string },
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
  let paramSafeColumns: RetArray = Array.isArray(only)
    ? ((dreamClass.paramSafeColumnsOrFallback() as string[]).filter(column =>
        only.includes(column as (typeof only)[number]),
      ) as unknown as RetArray)
    : (dreamClass.paramSafeColumnsOrFallback() as string[] as RetArray)

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
