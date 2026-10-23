import PsychicController from '../../../src/controller/index.js'
import ParamValidationErrors from '../../../src/error/controller/ParamValidationErrors.js'
import User from '../../../test-app/src/app/models/User.js'
import { createMockKoaContext } from './helpers/mockRequest.js'

describe('PsychicController', () => {
  describe('#paramsFor', () => {
    it('returns filtered params', () => {
      const ctx = createMockKoaContext({
        body: { id: 1, name: 'howyadoin', createdAt: 'hello', updatedAt: 'birld', deletedAt: 'sometimeago' },
      })
      const controller = new PsychicController(ctx, { action: 'hello' })

      expect(controller.paramsFor(User)).toEqual({ name: 'howyadoin' })
    })

    context('with virtual attributes', () => {
      it('permits virtual attributes in only option', () => {
        const ctx = createMockKoaContext({
          body: {
            password: 'howyadoin',
          },
        })
        const controller = new PsychicController(ctx, { action: 'hello' })

        expect(controller.paramsFor(User, { only: ['password'] })).toEqual({ password: 'howyadoin' })
      })
    })

    context('leading and trailing whitespace is filtered from strings', () => {
      it('returns filtered params', () => {
        const ctx = createMockKoaContext({
          body: {
            id: 1,
            name: 'howyadoin   ',
            createdAt: 'hello',
            updatedAt: 'birld',
            deletedAt: 'sometimeago',
          },
        })
        const controller = new PsychicController(ctx, { action: 'hello' })

        expect(controller.paramsFor(User)).toEqual({ name: 'howyadoin' })
      })
    })

    context('with a key passed', () => {
      it('drills into the params via the provided key', () => {
        const ctx = createMockKoaContext({
          body: {
            user: {
              id: 1,
              name: 'howyadoin',
              createdAt: 'hello',
              updatedAt: 'birld',
              deletedAt: 'sometimeago',
            },
          },
        })
        const controller = new PsychicController(ctx, { action: 'hello' })

        expect(controller.paramsFor(User, { key: 'user' })).toEqual({ name: 'howyadoin' })
      })

      context('the key is not present', () => {
        it('does not raise an exception', () => {
          const ctx = createMockKoaContext({
            body: {},
          })

          const controller = new PsychicController(ctx, { action: 'hello' })

          expect(controller.paramsFor(User, { key: 'user' })).toEqual({})
        })
      })
    })

    context('with array: true', () => {
      it('returns an array of filtered param objects from the key', () => {
        const ctx = createMockKoaContext({
          body: { users: [{ id: 1, name: 'a', createdAt: 'x' }, { name: 'b' }] },
        })
        const controller = new PsychicController(ctx, { action: 'hello' })

        expect(controller.paramsFor(User, { key: 'users', array: true })).toEqual([
          { name: 'a' },
          { name: 'b' },
        ])
      })

      context('the key is not present', () => {
        it('returns an empty array', () => {
          const ctx = createMockKoaContext({ body: {} })
          const controller = new PsychicController(ctx, { action: 'hello' })

          expect(controller.paramsFor(User, { key: 'users', array: true })).toEqual([])
        })
      })

      context('the key is null', () => {
        it('returns an empty array', () => {
          const ctx = createMockKoaContext({ body: { users: null } })
          const controller = new PsychicController(ctx, { action: 'hello' })

          expect(controller.paramsFor(User, { key: 'users', array: true })).toEqual([])
        })
      })

      context('the key holds a single object instead of an array', () => {
        it('raises ParamValidationErrors', () => {
          const ctx = createMockKoaContext({ body: { users: { name: 'a' } } })
          const controller = new PsychicController(ctx, { action: 'hello' })

          let error: unknown
          try {
            controller.paramsFor(User, { key: 'users', array: true })
          } catch (err) {
            error = err
          }

          expect(error).toBeInstanceOf(ParamValidationErrors)
          expect((error as ParamValidationErrors).errors).toEqual({ users: ['expected an array of objects'] })
        })
      })

      context('no key is given', () => {
        it('raises a developer error, not a ParamValidationErrors', () => {
          const ctx = createMockKoaContext({ body: { users: [{ name: 'a' }] } })
          const controller = new PsychicController(ctx, { action: 'hello' })

          let error: unknown
          try {
            controller.paramsFor(User, { array: true })
          } catch (err) {
            error = err
          }

          expect(error).toBeInstanceOf(Error)
          expect(error).not.toBeInstanceOf(ParamValidationErrors)
          expect((error as Error).message).toMatch(/paramsFor with `array: true` requires a `key`/)
        })
      })
    })

    context('with options passed', () => {
      it('passes options through', () => {
        const ctx = createMockKoaContext({
          body: {
            id: 1,
            name: 'howyadoin',
            email: 'how@yadoin',
            createdAt: 'hello',
            updatedAt: 'birld',
            deletedAt: 'sometimeago',
          },
        })
        const controller = new PsychicController(ctx, { action: 'hello' })

        expect(controller.paramsFor(User, { only: ['name'] })).toEqual({ name: 'howyadoin' })
      })
    })
  })
})
