// the properties Koa's ctx.onerror assigns on the error it handles
const propertiesKoaAssigns = ['status', 'headerSent'] as const

const wrapperMessage =
  'psychic wrapped this error so that Koa can respond to it; the original error is the cause'

/**
 * @internal
 *
 * The error to hand to Koa's default error handler (`ctx.onerror`) in place
 * of `err`: `err` itself when Koa can respond to it, otherwise a plain
 * `Error` whose `cause` is `err`, which Koa answers with a 500.
 *
 * Koa's handler assigns `status` on the error it handles (and `headerSent`
 * once headers are out) before responding. When that assignment throws, as
 * it does for a psychic `HttpError`, whose `status` is a getter, or for a
 * frozen error, the handler crashes: the request gets no response and the
 * rejection goes unhandled. The handler also ignores a thrown `null` or
 * `undefined`, leaving the request without a response.
 *
 * Any other value is returned unchanged, so Koa still answers it as it
 * would have: an error from `ctx.throw` with its own status and headers, and
 * a thrown non-error, which Koa wraps itself.
 */
export default function errorKoaCanHandle(err: unknown): unknown {
  if (err === null || err === undefined) return new Error(wrapperMessage, { cause: err })
  if (!koaTreatsAsError(err)) return err

  try {
    if (propertiesKoaAssigns.every(property => isAssignable(err, property))) return err
  } catch {
    // a throwing proxy trap: Koa's own assignment could throw too
  }

  return new Error(wrapperMessage, { cause: err })
}

// Koa's own test for a thrown value it handles as is, rather than wrapping
function koaTreatsAsError(err: unknown): err is object {
  return Object.prototype.toString.call(err) === '[object Error]' || err instanceof Error
}

// whether `object[property] = value` succeeds in strict mode, found the way
// assignment finds it: the nearest own or inherited property decides
function isAssignable(object: object, property: string): boolean {
  for (
    let owner: object | null = object;
    owner !== null;
    owner = Object.getPrototypeOf(owner) as object | null
  ) {
    const descriptor = Object.getOwnPropertyDescriptor(owner, property)
    if (!descriptor) continue

    // an accessor: assignable only through a setter
    if (!('value' in descriptor)) return descriptor.set !== undefined

    if (!descriptor.writable) return false
    // an inherited writable data property: assignment adds an own property
    return owner === object || Object.isExtensible(object)
  }

  return Object.isExtensible(object)
}
