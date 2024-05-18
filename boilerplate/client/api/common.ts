import axios from 'axios'
import routes from '../config/routes'
import apiRoutes from './apiRoutes'
import { Path, PathValue } from './type-helpers'

export const api = axios.create({
  withCredentials: true,
  baseURL: routes.baseURL,
})

export function apiCall<P extends Path<typeof apiRoutes>, Args extends ApiCallArgs<P>>(
  route: P,
  ...pathArgs: Args extends undefined ? [undefined?] : [Args]
) {
  const routeParts = route.split('.')
  let httpMethod: string | undefined = undefined
  let i = 0
  const routeConf: any = routeParts.reduce((agg, part) => {
    if (i++ === routeParts.length - 1) httpMethod = part
    return (agg as any)[part]
  }, apiRoutes)

  if (!routeConf) {
    throw new Error(`Invalid route passed to apiCall helper: "${route}"`)
  }

  return {
    send({ body, query }: { body?: any; query?: any } = {}) {
      const path: string = typeof routeConf === 'function' ? routeConf(pathArgs) : routeConf

      switch (httpMethod?.toLowerCase()) {
        case 'post':
          return api.post(path, body, { params: query })

        case 'put':
          return api.put(path, body, { params: query })

        case 'patch':
          return api.patch(path, body, { params: query })

        case 'get':
          return api.get(path, { params: query })

        case 'delete':
          return api.delete(path, { params: query })

        default:
          throw new Error(`Unrecognized http method found when attempting to call to api: ${httpMethod}`)
      }
    },
  }
}

export type ApiCallArgs<T extends Path<typeof apiRoutes>> =
  PathValue<typeof apiRoutes, T> extends (...args: any) => any
    ? Parameters<PathValue<typeof apiRoutes, T>>[0]
    : undefined
