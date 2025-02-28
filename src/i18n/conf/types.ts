type I18N_RECURSION_MAX = 20

export type PathsToStringProps<T, Depth extends number = 0> = Depth extends I18N_RECURSION_MAX
  ? never
  : T extends string
    ? []
    : {
        [K in Extract<keyof T, string>]: [K, ...PathsToStringProps<T[K], Inc<Depth>>]
      }[Extract<keyof T, string>]

export type Join<T extends string[], D extends string> = T extends []
  ? never
  : T extends [infer F]
    ? F
    : T extends [infer F, ...infer R]
      ? F extends string
        ? `${F}${D}${Join<Extract<R, string[]>, D>}`
        : never
      : string

export type DottedLanguageObjectStringPaths<SingleLocale> = Join<PathsToStringProps<SingleLocale>, '.'>

export type GenericI18nObject = { [k: string]: string | GenericI18nObject }

export type Inc<T extends number> =
  // Check `T`'s value on every number from 0 to 31 and return the next value each time.
  // If it's out of scope, just return `never`.
  T extends keyof IncTable ? IncTable[T] : never

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
