import { Dream } from '@rvoh/dream'
import { DreamParamSafeAttributes, DreamParamSafeColumnNames, StrictInterface } from '@rvoh/dream/types'
import type { ExtractedDreamParamSafeAttributes, ParamsForOpts } from '../params.js'

export default function paramNamesForDreamClass<
  T extends typeof Dream,
  I extends InstanceType<T>,
  const OnlyArray extends readonly (keyof DreamParamSafeAttributes<I>)[],
  ForOpts extends StrictInterface<ForOpts, ParamsForOpts<OnlyArray>>,
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
  RetArray = (keyof ReturnPartialType)[],
>(dreamClass: T, { only }: ForOpts = {} as ForOpts): RetArray {
  // `paramSafeColumnsOrFallback` is a Dream internal, reached through the bracketed
  // back-door (the same escape hatch psychic uses for `virtualAttributes`). Dream
  // declares it `private static`, which TypeScript erases to an untyped member in
  // `Dream.d.ts`, so the member is cast to a concrete signature here to keep the
  // return shape checked instead of degrading to `any`. `.call` preserves `this`,
  // which the Dream implementation relies on.
  const paramSafeColumns = (
    dreamClass['paramSafeColumnsOrFallback'] as unknown as (this: T) => string[]
  ).call(dreamClass)

  return Array.isArray(only)
    ? (paramSafeColumns.filter(column =>
        only.includes(column as (typeof only)[number]),
      ) as unknown as RetArray)
    : (paramSafeColumns as unknown as RetArray)
}
