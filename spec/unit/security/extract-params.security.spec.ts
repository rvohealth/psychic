import PsychicController from '../../../src/controller/index.js'
import ParamValidationError from '../../../src/error/controller/ParamValidationError.js'
import ParamValidationErrors from '../../../src/error/controller/ParamValidationErrors.js'
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
        const typedResult: Partial<{ name: string | null }>[] = result

        expect(typedResult).toEqual(result)
        expect(result).toEqual([{ name: 'a' }, { name: 'b' }])
      })

      // an optional list the client leaves out is an empty list, as a missing
      // key without `array: true` is an empty object
      it('returns an empty array when the key is missing', () => {
        const ctx = createMockKoaContext({ body: {} })
        const controller = new PsychicController(ctx, { action: 'hello' })

        expect(controller.extractParams(User, ['name'], { key: 'users', array: true })).toEqual([])
      })

      it('returns an empty array when the key is null', () => {
        const ctx = createMockKoaContext({ body: { users: null } })
        const controller = new PsychicController(ctx, { action: 'hello' })

        expect(controller.extractParams(User, ['name'], { key: 'users', array: true })).toEqual([])
      })

      it.each([
        ['a single object', { name: 'a' }],
        ['an empty object', {}],
        ['a falsy value', ''],
        ['an array containing null', [null]],
      ])('rejects %s with ParamValidationErrors', (_, users) => {
        const ctx = createMockKoaContext({ body: { users } })
        const controller = new PsychicController(ctx, { action: 'hello' })

        expect(() => controller.extractParams(User, ['name'], { key: 'users', array: true })).toThrow(
          ParamValidationErrors,
        )
      })

      // the params are always an object (a top-level JSON array body is merged
      // into numeric keys), so `array: true` can only read a list under a key:
      // without one it is a programming error, not a client error
      it('raises a developer error, not a ParamValidationErrors, when no key is given', () => {
        const ctx = createMockKoaContext({ body: { users: [{ name: 'a' }] } })
        const controller = new PsychicController(ctx, { action: 'hello' })

        let error: unknown
        try {
          controller.extractParams(User, ['name'], { array: true })
        } catch (err) {
          error = err
        }

        expect(error).toBeInstanceOf(Error)
        expect(error).not.toBeInstanceOf(ParamValidationError)
        expect(error).not.toBeInstanceOf(ParamValidationErrors)
        expect((error as Error).message).toMatch(/extractParams with `array: true` requires a `key`/)
      })
    })
  })
})
