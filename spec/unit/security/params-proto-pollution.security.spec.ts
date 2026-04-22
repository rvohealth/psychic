import PsychicController from '../../../src/controller/index.js'
import { createMockKoaContext } from '../controller/helpers/mockRequest.js'

// R-012 prototype pollution defense-in-depth. Node's JSON.parse already
// treats `__proto__` as an OWN property (not a prototype mutation), and
// koa-bodyparser's qs dependency defaults `allowPrototypes: false` at
// v6.10+. Psychic layers a prototype-less merge target as a structural
// guarantee: even if an upstream parser misconfig lets `__proto__` /
// `constructor` / `prototype` arrive as OWN keys, they cannot reach
// Object.prototype through this getter.

describe('params getter — prototype pollution defense (R-012)', () => {
  afterEach(() => {
    // Scrub any accidental pollution between assertions. If the guard works,
    // this is a no-op; if it breaks, subsequent specs would otherwise inherit
    // the pollution.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
    delete (Object.prototype as any).polluted
  })

  it('refuses to mutate Object.prototype when body contains __proto__', () => {
    const ctx = createMockKoaContext({
      body: JSON.parse('{"__proto__": {"polluted": true}, "name": "hi"}') as object,
    })
    const controller = new PsychicController(ctx, { action: 'hello' })

    // Touch the getter so any merge side-effect would fire.
    void controller.params

    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
    expect(({} as any).polluted).toBeUndefined()
  })

  it('returns a prototype-less params object', () => {
    const ctx = createMockKoaContext({
      body: { name: 'hi' },
    })
    const controller = new PsychicController(ctx, { action: 'hello' })

    const params = controller.params
    expect(Object.getPrototypeOf(params)).toBeNull()
  })

  it('preserves normal access to own properties', () => {
    const ctx = createMockKoaContext({
      body: { name: 'howdy', color: 'red' },
    })
    const controller = new PsychicController(ctx, { action: 'hello' })

    const params = controller.params
    expect(params.name).toEqual('howdy')
    expect(params.color).toEqual('red')
  })
})
