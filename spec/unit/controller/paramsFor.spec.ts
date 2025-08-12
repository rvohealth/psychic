import { getMockReq, getMockRes } from '@jest-mock/express'
import { Request, Response } from 'express'
import PsychicController from '../../../src/controller/index.js'
import User from '../../../test-app/src/app/models/User.js'

describe('PsychicController', () => {
  describe('#paramsFor', () => {
    it('returns filtered params', () => {
      const req = getMockReq({
        body: { id: 1, name: 'howyadoin', createdAt: 'hello', updatedAt: 'birld', deletedAt: 'sometimeago' },
      }) as unknown as Request
      const res = getMockRes().res as unknown as Response
      const controller = new PsychicController(req, res, { action: 'hello' })

      expect(controller.paramsFor(User)).toEqual({ name: 'howyadoin' })
    })

    context('with virtual attributes', () => {
      it('permits virtual attributes in only option', () => {
        const req = getMockReq({
          body: {
            password: 'howyadoin',
          },
        }) as unknown as Request
        const res = getMockRes().res as unknown as Response
        const controller = new PsychicController(req, res, { action: 'hello' })

        expect(controller.paramsFor(User, { only: ['password'] })).toEqual({ password: 'howyadoin' })
      })
    })

    context('leading and trailing whitespace is filtered from strings', () => {
      it('returns filtered params', () => {
        const req = getMockReq({
          body: {
            id: 1,
            name: 'howyadoin   ',
            createdAt: 'hello',
            updatedAt: 'birld',
            deletedAt: 'sometimeago',
          },
        }) as unknown as Request
        const res = getMockRes().res as unknown as Response
        const controller = new PsychicController(req, res, { action: 'hello' })

        expect(controller.paramsFor(User)).toEqual({ name: 'howyadoin' })
      })
    })

    context('with a key passed', () => {
      it('drills into the params via the provided key', () => {
        const req = getMockReq({
          body: {
            user: {
              id: 1,
              name: 'howyadoin',
              createdAt: 'hello',
              updatedAt: 'birld',
              deletedAt: 'sometimeago',
            },
          },
        }) as unknown as Request
        const res = getMockRes().res as unknown as Response
        const controller = new PsychicController(req, res, { action: 'hello' })

        expect(controller.paramsFor(User, { key: 'user' })).toEqual({ name: 'howyadoin' })
      })

      context('the key is not present', () => {
        it('does not raise an exception', () => {
          const req = getMockReq({
            body: {},
          }) as unknown as Request

          const res = getMockRes().res as unknown as Response
          const controller = new PsychicController(req, res, { action: 'hello' })

          expect(controller.paramsFor(User, { key: 'user' })).toEqual({})
        })
      })
    })

    context('with options passed', () => {
      it('passes options through', () => {
        const req = getMockReq({
          body: {
            id: 1,
            name: 'howyadoin',
            email: 'how@yadoin',
            createdAt: 'hello',
            updatedAt: 'birld',
            deletedAt: 'sometimeago',
          },
        }) as unknown as Request
        const res = getMockRes().res as unknown as Response
        const controller = new PsychicController(req, res, { action: 'hello' })

        expect(controller.paramsFor(User, { only: ['name'] })).toEqual({ name: 'howyadoin' })
      })
    })
  })
})
