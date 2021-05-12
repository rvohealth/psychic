export function parseRoute(str) {
  const orig = str
  const key = stripOpeningSlash(str)
  const segments = routeSegments(key)
  const params = routeParams(str)

  return {
    orig,
    key,
    segments,
    params,
  }
}

export function stripOpeningSlash(str) {
  return str.replace(/^\//, '')
}

export function routeSegments(str) {
  return str.split('/')
}

export function routeParams(str) {
  return str
    .split('/')
    .filter(segment => /:[a-zA-Z0-9-_]/.test(segment))
    .map(segment => ({
      path: segment,
      name: segment.replace(/^:/, ''),
    }))
}
