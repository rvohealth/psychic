import PsychicController from '../../../src/controller/index.js'
import InternalEncrypt from '../../../src/encrypt/internal-encrypt.js'
import User from '../../../test-app/src/app/models/User.js'
import { createMockKoaContext } from './helpers/mockRequest.js'

describe('PsychicController', () => {
  describe('#getCookie', () => {
    it('returns the value of an existing cookie, automatically decrypted', async () => {
      const user = await User.create({ email: 'how@yadoin', password: 'password' })

      const ctx = createMockKoaContext({
        cookies: { auth_token: InternalEncrypt.encryptCookie(user.id.toString()) },
      })
      const controller = new PsychicController(ctx, { action: 'hello' })
      expect(controller.getCookie('auth_token')).toEqual(user.id.toString())
    })
  })

  describe('#setCookie', () => {
    it('calls to underlying session instance, passing options along', () => {
      const ctx = createMockKoaContext()
      const controller = new PsychicController(ctx, { action: 'hello' })

      const spy = vi.spyOn(controller.session, 'setCookie')
      controller.setCookie('auth_token', 'abc', { secure: true, maxAge: { days: 4 } })
      expect(spy).toHaveBeenCalledWith('auth_token', 'abc', { secure: true, maxAge: { days: 4 } })
    })
  })
})
