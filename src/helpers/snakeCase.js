export default function snakeCase(str) {
  if (Array.isArray(str)) {
    return str.map(s => snakeCase(s))
  }

  if (typeof str === 'object') {
    return Object.keys(str).reduce((agg, s) => {
      agg[snakeCase(s)] = str[s]
      return agg
    }, {})
  }

  return str
    .replace(/(?:^|\.?)([A-Z])/g, (_, y) =>
      "_" + y.toLowerCase()
    )
    .replace(/^_/, "")
}
