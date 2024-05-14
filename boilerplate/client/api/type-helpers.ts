export type Inc<T extends number> = T extends keyof IncTable ? IncTable[T] : never

type IncTable = {
  0: 1
  1: 2
  2: 3
  3: 4
  4: 5
  5: 6
  6: 7
  7: 8
  8: 9
  9: 10
  10: 11
  11: 12
  12: 13
  13: 14
  14: 15
  15: 16
  16: 17
  17: 18
  18: 19
  19: 20
  20: 21
  21: 22
  22: 23
  23: 24
  24: 25
  25: 26
  26: 27
  27: 28
  28: 29
  29: 30
  30: 31
  31: 32
}

export type Decrement<T extends number> = T extends keyof DecrementTable ? DecrementTable[T] : never

type DecrementTable = {
  0: -1
  1: 0
  2: 1
  3: 2
  4: 3
  5: 4
  6: 5
  7: 6
  8: 7
  9: 8
  10: 9
  11: 10
  12: 11
  13: 12
  14: 13
  15: 14
  16: 15
  17: 16
  18: 17
  19: 18
  20: 19
  21: 20
  22: 21
  23: 22
  24: 23
  25: 24
  26: 25
  27: 26
  28: 27
  29: 28
  30: 29
  31: 30
}

// begin: types copied from https://github.com/g-makarov/dot-path-value

export type Primitive = null | undefined | string | number | boolean | symbol | bigint

type ArrayKey = number

type IsTuple<T extends readonly any[]> = number extends T['length'] ? false : true

type TupleKeys<T extends readonly any[]> = Exclude<keyof T, keyof any[]>

export type PathConcat<TKey extends string | number, TValue> = TValue extends Primitive
  ? `${TKey}`
  : `${TKey}` | `${TKey}.${Path<TValue>}`

export type Path<T> = T extends readonly (infer V)[]
  ? IsTuple<T> extends true
    ? {
        [K in TupleKeys<T>]-?: PathConcat<K & string, T[K]>
      }[TupleKeys<T>]
    : PathConcat<ArrayKey, V>
  : {
      [K in keyof T]-?: PathConcat<K & string, T[K]>
    }[keyof T]

type ArrayPathConcat<TKey extends string | number, TValue> = TValue extends Primitive
  ? never
  : TValue extends readonly (infer U)[]
  ? U extends Primitive
    ? never
    : `${TKey}` | `${TKey}.${ArrayPath<TValue>}`
  : `${TKey}.${ArrayPath<TValue>}`

export type ArrayPath<T> = T extends readonly (infer V)[]
  ? IsTuple<T> extends true
    ? {
        [K in TupleKeys<T>]-?: ArrayPathConcat<K & string, T[K]>
      }[TupleKeys<T>]
    : ArrayPathConcat<ArrayKey, V>
  : {
      [K in keyof T]-?: ArrayPathConcat<K & string, T[K]>
    }[keyof T]

export type PathValue<T, TPath extends Path<T> | ArrayPath<T>> = T extends any
  ? TPath extends `${infer K}.${infer R}`
    ? K extends keyof T
      ? R extends Path<T[K]>
        ? undefined extends T[K]
          ? PathValue<T[K], R> | undefined
          : PathValue<T[K], R>
        : never
      : K extends `${ArrayKey}`
      ? T extends readonly (infer V)[]
        ? PathValue<V, R & Path<V>>
        : never
      : never
    : TPath extends keyof T
    ? T[TPath]
    : TPath extends `${ArrayKey}`
    ? T extends readonly (infer V)[]
      ? V
      : never
    : never
  : never

// end: types copied from https://github.com/g-makarov/dot-path-value
