import { getMockReq, getMockRes } from '@jest-mock/express'
import { Request, Response } from 'express'
import PsychicController from '../../../src/controller/index.js'

describe('PsychicController', () => {
  describe('get #params', () => {
    it('returns both body and query params', () => {
      const req = getMockReq({
        body: { search: 'abc' },
        query: { cool: 'boyjohnson' },
      }) as unknown as Request
      const res = getMockRes().res as unknown as Response
      const controller = new PsychicController(req, res, { action: 'hello' })

      expect(controller.params.search).toEqual('abc')
      expect(controller.params.cool).toEqual('boyjohnson')
    })
  })
})
