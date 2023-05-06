export default function snakeify(str: any): string {
  // if (Array.isArray(str)) {
  //   return str.map(s => snakeify(s))
  // }

  // if (typeof str === 'object') {
  //   return Object.keys(str).reduce((agg, s) => {
  //     if (typeof str[s] === 'object') return snakeify(str[s])

  //     agg[snakeify(s)] = str[s]
  //     return agg
  //   }, {})
  // }

  return str
    .replace(/(?:^|\.?)([A-Z])/g, (_: string, y: string) => '_' + y.toLowerCase())
    .replace(/^_/, '')
    .replace(/\//g, '_')
    .replace(/-/g, '_')
    .replace(/_+/g, '_')
    .toLowerCase()
}
