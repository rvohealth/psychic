import { getMockReq, getMockRes } from '@jest-mock/express'
import { Encrypt } from '../../../src'
import PsychicController from '../../../src/controller'
import PsychicApplication from '../../../src/psychic-application'
import User from '../../../test-app/app/models/User'

describe('PsychicController', () => {
  describe('#getCookie', () => {
    it('returns the value of an existing cookie, automatically decrypted', async () => {
      const user = await User.create({ email: 'how@yadoin', password: 'password' })

      const req = getMockReq()
      req.cookies = { auth_token: Encrypt.sign(user.id.toString()) }

      const res = getMockRes().res
      const controller = new PsychicController(req, res, {
        config: new PsychicApplication(),
        action: 'hello',
      })
      expect(controller.getCookie('auth_token')).toEqual(user.id.toString())
    })
  })

  describe('#setCookie', () => {
    it('calls to underlying session instance, passing options along', () => {
      const req = getMockReq()
      const res = getMockRes().res
      const controller = new PsychicController(req, res, {
        config: new PsychicApplication(),
        action: 'hello',
      })

      const spy = jest.spyOn(controller.session, 'setCookie')
      controller.setCookie('auth_token', 'abc', { secure: true, maxAge: { days: 4 } })
      expect(spy).toHaveBeenCalledWith('auth_token', 'abc', { secure: true, maxAge: { days: 4 } })
    })
  })
})
