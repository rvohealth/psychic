export type FunctionProperties<T> = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [K in keyof T as T[K] extends (...args: any[]) => any ? K : never]: T[K]
}
export type FunctionPropertyNames<T> = keyof FunctionProperties<T> & string

export type StringToInt<T extends string> = T extends `${infer N extends number}` ? N : never
