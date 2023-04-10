export default function pathifyNestedObject(obj: any, prefix = '') {
  return Object.keys(obj).reduce((acc, k) => {
    const pre = prefix.length ? prefix + '/' : ''
    if (typeof obj[k] === 'object') Object.assign(acc, pathifyNestedObject(obj[k], pre + k))
    else (acc as any)[pre + k] = obj[k]
    return acc
  }, {})
}
