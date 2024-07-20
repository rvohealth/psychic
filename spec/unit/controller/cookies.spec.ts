import { getMockReq, getMockRes } from '@jest-mock/express'
import PsychicController from '../../../src/controller'
import PsychicConfig from '../../../src/config'
import PsychicServer from '../../../src/server'
import User from '../../../test-app/app/models/User'
import { Encrypt } from '../../../src'

describe('PsychicController', () => {
  describe('#getCookie', () => {
    it('returns the value of an existing cookie, automatically decrypted', async () => {
      const user = await User.create({ email: 'how@yadoin', password: 'password' })

      const req = getMockReq()
      req.cookies = { auth_token: Encrypt.sign(user.id.toString()) }

      const res = getMockRes().res
      const server = new PsychicServer()
      const controller = new PsychicController(req, res, {
        config: new PsychicConfig(server.app),
        action: 'hello',
      })
      expect(controller.getCookie('auth_token')).toEqual(user.id.toString())
    })
  })

  describe('#setCookie', () => {
    it('calls to underlying session instance, passing options along', () => {
      const req = getMockReq()
      const res = getMockRes().res
      const server = new PsychicServer()
      const controller = new PsychicController(req, res, {
        config: new PsychicConfig(server.app),
        action: 'hello',
      })

      const spy = jest.spyOn(controller.session, 'setCookie')
      controller.setCookie('auth_token', 'abc', { secure: true, maxAge: { days: 4 } })
      expect(spy).toHaveBeenCalledWith('auth_token', 'abc', { secure: true, maxAge: { days: 4 } })
    })
  })
})
