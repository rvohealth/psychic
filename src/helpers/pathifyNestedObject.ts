import { isObject } from './typechecks'

type NestedObject = {
  [k: string]: string | number | boolean | string[] | number[] | boolean[] | NestedObject
}

export default function pathifyNestedObject(obj: NestedObject, prefix = '') {
  return Object.keys(obj).reduce((acc: NestedObject, k) => {
    const pre = prefix.length ? prefix + '/' : ''
    if (isObject(obj[k])) Object.assign(acc, pathifyNestedObject(obj[k] as NestedObject, pre + k))
    else acc[pre + k] = obj[k]
    return acc
  }, {})
}
