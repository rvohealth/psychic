/* eslint-disable @typescript-eslint/no-explicit-any */
import { Dream } from '@rvoh/dream'
import { DreamOrViewModelClassSerializerKey, DreamSerializableArray, ViewModelClass } from '@rvoh/dream/types'

export type FunctionProperties<T> = {
  [K in keyof T as T[K] extends (...args: any[]) => any ? K : never]: T[K]
}
export type FunctionPropertyNames<T> = keyof FunctionProperties<T> & string

export type StringToInt<T extends string> = T extends `${infer N extends number}` ? N : never

export type DreamOrViewModelClassSerializerArrayKeys<T extends DreamSerializableArray> = T['length'] extends 0
  ? string
  : T[0] extends typeof Dream | ViewModelClass
    ? DreamOrViewModelClassSerializerKey<T[0]> &
        DreamOrViewModelClassSerializerArrayKeys<T extends [any, ...infer Rest] ? Rest : never>
    : DreamOrViewModelClassSerializerArrayKeys<T extends [any, ...infer Rest] ? Rest : never>
