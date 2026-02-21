import Koa from 'koa'
import { HttpMethod } from '../../../../src/router/types.js'

export default ({
  // method = 'get',
  params = {},
  body = {},
  query = {},
  headers = {},
  cookies = {},
}: {
  method?: HttpMethod
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  params?: { [key: string]: any }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  body?: { [key: string]: any }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  query?: { [key: string]: any }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  headers?: { [key: string]: any }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  cookies?: { [key: string]: any }
} = {}): { ctx: Koa.Context } => ({
  ctx: createMockKoaContext({ params, body, query, headers, cookies }),
})

export function createMockKoaContext({
  params = {},
  body = {},
  query = {},
  headers = {},
  cookies = {},
  method = 'GET',
  url = '/',
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  params?: { [key: string]: any }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  body?: { [key: string]: any }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  query?: { [key: string]: any }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  headers?: { [key: string]: any }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  cookies?: { [key: string]: any }
  method?: string
  url?: string
} = {}): Koa.Context {
  let _status = 200
  let _body: unknown = undefined
  let _type = ''
  const _headers: Record<string, string> = {}

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const ctx = {
    method,
    url,
    status: _status,
    body: _body,
    type: _type,
    headerSent: false,
    params,
    request: {
      body,
      query,
      headers,
      method,
      url,
    },
    response: {
      get status() {
        return _status
      },
      set status(val: number) {
        _status = val
      },
      get body() {
        return _body
      },
      set body(val: unknown) {
        _body = val
      },
    },
    cookies: {
      get(name: string) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return cookies[name] ?? undefined
      },
      set(name: string, value: string) {
        cookies[name] = value
      },
    },
    set(key: string, value: string) {
      _headers[key] = value
    },
    get(key: string) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return headers[key] ?? _headers[key] ?? ''
    },
    redirect() {
      // no-op in mock
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any

  // Make status and body reactive on the top-level ctx object
  Object.defineProperty(ctx, 'status', {
    get() {
      return _status
    },
    set(val: number) {
      _status = val
    },
    enumerable: true,
    configurable: true,
  })

  Object.defineProperty(ctx, 'body', {
    get() {
      return _body
    },
    set(val: unknown) {
      _body = val
    },
    enumerable: true,
    configurable: true,
  })

  Object.defineProperty(ctx, 'type', {
    get() {
      return _type
    },
    set(val: string) {
      _type = val
    },
    enumerable: true,
    configurable: true,
  })

  return ctx as Koa.Context
}
