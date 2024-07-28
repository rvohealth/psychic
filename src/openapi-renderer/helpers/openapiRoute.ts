export default function openapiRoute(route: string) {
  const sanitizedRoute = route.replace(/^\//, '').replace(/:([^/]*)(\/|$)/g, '{$1}')
  return `/${sanitizedRoute}`
}
