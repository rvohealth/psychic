import { Dream, DreamAttributes, DreamParamSafeAttributes, DreamParamSafeColumnNames } from '@rvoh/dream'
import { ParamExclusionOptions } from '../params.js'

export default function paramNamesForDreamClass<
  T extends typeof Dream,
  I extends InstanceType<T>,
  const OnlyArray extends readonly (keyof DreamParamSafeAttributes<I>)[],
  const IncludingArray extends Exclude<keyof DreamAttributes<I>, OnlyArray[number]>[],
  ForOpts extends ParamExclusionOptions<OnlyArray, IncludingArray>,
  ParamSafeColumnsOverride extends I['paramSafeColumns' & keyof I] extends never
    ? undefined
    : I['paramSafeColumns' & keyof I] & string[],
  ParamSafeColumns extends ParamSafeColumnsOverride extends string[] | Readonly<string[]>
    ? Extract<DreamParamSafeColumnNames<I>, ParamSafeColumnsOverride[number] & DreamParamSafeColumnNames<I>>[]
    : DreamParamSafeColumnNames<I>[],
  ReturnPartialWithOnly extends ForOpts['only'] extends readonly (keyof DreamParamSafeAttributes<
    InstanceType<T>
  >)[]
    ? Partial<{
        [K in Extract<
          ParamSafeColumns[number],
          ForOpts['only'][number & keyof ForOpts['only']]
        >]: DreamParamSafeAttributes<InstanceType<T>>[K]
      }>
    : Partial<{
        [K in ParamSafeColumns[number & keyof ParamSafeColumns] & string]: DreamParamSafeAttributes<
          InstanceType<T>
        >[K & keyof DreamParamSafeAttributes<InstanceType<T>>]
      }>,
  ReturnPartialWithIncluding extends ForOpts['including'] extends readonly (keyof DreamAttributes<
    InstanceType<T>
  >)[]
    ? ReturnPartialWithOnly &
        Partial<{
          [K in Extract<
            keyof DreamAttributes<InstanceType<T>>,
            ForOpts['including'][number & keyof ForOpts['including']]
          >]: DreamAttributes<InstanceType<T>>[K]
        }>
    : ReturnPartialWithOnly,
  RetArray = (keyof ReturnPartialWithIncluding)[],
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
        ...dreamClass['virtualAttributes'].map(statement => statement.property),
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any
      ].filter(columnName => including.includes(columnName as any)),
    ] as RetArray
  }

  return paramSafeColumns
}
