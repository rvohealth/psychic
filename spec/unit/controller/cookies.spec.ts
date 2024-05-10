import { getMockReq, getMockRes } from '@jest-mock/express'
import PsychicController from '../../../src/controller'
import PsychicConfig from '../../../src/config'
import PsychicServer from '../../../src/server'
import User from '../../../test-app/app/models/User'
import { Encrypt } from '../../../src'

describe('PsychicController', () => {
  describe('#cookie', () => {
    it('returns the value of an existing cookie, automatically decrypted', async () => {
      const user = await User.create({ email: 'how@yadoin', password: 'password' })

      const req = getMockReq({ body: { search: 'abc' }, query: { cool: 'boyjohnson' } })
      req.cookies = { auth_token: Encrypt.sign(user.id.toString()) }

      const res = getMockRes().res
      const server = new PsychicServer()
      const controller = new PsychicController(req, res, { config: new PsychicConfig(server.app) })
      expect(controller.cookie('auth_token')).toEqual(user.id.toString())
    })
  })
})
