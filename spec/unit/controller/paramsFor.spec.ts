import Koa from 'koa'
import PsychicController from '../../../src/controller/index.js'
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
