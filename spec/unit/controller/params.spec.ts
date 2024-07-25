import { getMockReq, getMockRes } from '@jest-mock/express'
import { Params } from '../../../src'
import PsychicController from '../../../src/controller'
import Psyconf from '../../../src/psyconf'
import User from '../../../test-app/app/models/User'

describe('PsychicController', () => {
  describe('get #params', () => {
    it('returns both body and query params', () => {
      const req = getMockReq({ body: { search: 'abc' }, query: { cool: 'boyjohnson' } })
      const res = getMockRes().res
      const controller = new PsychicController(req, res, {
        config: new Psyconf(),
        action: 'hello',
      })

      expect(controller.params.search).toEqual('abc')
      expect(controller.params.cool).toEqual('boyjohnson')
    })
  })

  describe('#castParam', () => {
    let controller: PsychicController

    beforeEach(() => {
      const req = getMockReq({
        body: { id: 1, name: 'howyadoin', createdAt: 'hello', updatedAt: 'birld', deletedAt: 'sometimeago' },
      })
      const res = getMockRes().res
      controller = new PsychicController(req, res, { config: new Psyconf(), action: 'hello' })
    })

    it('returns the result of Params.cast', () => {
      const spy = jest.spyOn(Params, 'cast').mockReturnValue('chalupas dujour')
      expect(controller.castParam('name', 'string', { allowNull: true })).toEqual('chalupas dujour')
      expect(spy).toHaveBeenCalledWith('howyadoin', 'string', { allowNull: true })
    })
  })

  describe('#paramsFor', () => {
    it('returns filtered params', () => {
      const req = getMockReq({
        body: { id: 1, name: 'howyadoin', createdAt: 'hello', updatedAt: 'birld', deletedAt: 'sometimeago' },
      })
      const res = getMockRes().res
      const controller = new PsychicController(req, res, {
        config: new Psyconf(),
        action: 'hello',
      })

      expect(controller.paramsFor(User)).toEqual({ name: 'howyadoin' })
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
        })
        const res = getMockRes().res
        const controller = new PsychicController(req, res, {
          config: new Psyconf(),
          action: 'hello',
        })

        expect(controller.paramsFor(User, { key: 'user' })).toEqual({ name: 'howyadoin' })
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
        })
        const res = getMockRes().res
        const controller = new PsychicController(req, res, {
          config: new Psyconf(),
          action: 'hello',
        })

        expect(controller.paramsFor(User, { only: ['name'] })).toEqual({ name: 'howyadoin' })
      })
    })
  })
})
