export default function openapiRoute(route: string) {
  const sanitizedRoute = route
    .replace(/^\//, '')
    .replace(/:([a-zA-Z0-9$_]*)\//g, '{$1}')
    .replace(/:([a-zA-Z0-9$_]*)$/g, '{$1}')
  return `/${sanitizedRoute}`
}
