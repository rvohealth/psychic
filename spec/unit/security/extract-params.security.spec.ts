import PsychicController from '../../../src/controller/index.js'
import User from '../../../test-app/src/app/models/User.js'
import { createMockKoaContext } from '../controller/helpers/mockRequest.js'

// R-011 `extractParams` is the explicit-allowlist primitive replacing
// bare `paramsFor(Model)` as the generator default. It enforces the same
// runtime invariants that `paramsFor` did; the security-relevant delta is
// that the allowlist is visible at the call site.

describe('PsychicController extract-params primitives (R-011)', () => {
  describe('#extractParams', () => {
    it('returns only the fields listed in the allowed array', () => {
      const ctx = createMockKoaContext({
        body: {
          id: 1,
          name: 'howyadoin',
          nicknames: ['nick', 'name'],
          createdAt: 'hello',
          updatedAt: 'birld',
          deletedAt: 'sometimeago',
        },
      })
      const controller = new PsychicController(ctx, { action: 'hello' })

      expect(controller.extractParams(User, ['name'])).toEqual({ name: 'howyadoin' })
    })

    it('drops protected columns even if a caller bypasses the type system', () => {
      const ctx = createMockKoaContext({
        body: {
          id: 1,
          name: 'howyadoin',
          createdAt: 'hello',
        },
      })
      const controller = new PsychicController(ctx, { action: 'hello' })

      // @ts-expect-error — `id` and `createdAt` are protected; the ts-expect-error
      // itself is the compile-time proof. The runtime check below also strips them.
      const result = controller.extractParams(User, ['name', 'id', 'createdAt'])
      expect(result).toEqual({ name: 'howyadoin' })
    })

    context('with a key option', () => {
      it('extracts from the nested key', () => {
        const ctx = createMockKoaContext({
          body: {
            user: { id: 1, name: 'howyadoin', createdAt: 'hello' },
          },
        })
        const controller = new PsychicController(ctx, { action: 'hello' })

        expect(controller.extractParams(User, ['name'], { key: 'user' })).toEqual({ name: 'howyadoin' })
      })

      it('does not raise when the key is missing', () => {
        const ctx = createMockKoaContext({ body: {} })
        const controller = new PsychicController(ctx, { action: 'hello' })

        expect(controller.extractParams(User, ['name'], { key: 'user' })).toEqual({})
      })
    })

    context('with array: true', () => {
      it('returns an array of filtered param objects', () => {
        const ctx = createMockKoaContext({
          body: [
            { id: 1, name: 'a', createdAt: 'x' },
            { id: 2, name: 'b', createdAt: 'y' },
          ],
        })
        const controller = new PsychicController(ctx, { action: 'hello' })
        // The `params` getter merges arrays into numeric keys; exercise via key extraction.
        ctx.request.body = {
          users: [
            { name: 'a', id: 1 },
            { name: 'b', id: 2 },
          ],
        }

        const result = controller.extractParams(User, ['name'], { key: 'users', array: true })
        expect(result).toEqual([{ name: 'a' }, { name: 'b' }])
      })
    })
  })
})
