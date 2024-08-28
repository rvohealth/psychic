export default function openapiRoute(route: string) {
  const sanitizedRoute = route.replace(/^\//, '').replace(/:([^/]*)(\/|$)/g, '{$1}$2')
  return `/${sanitizedRoute}`
}
