import bcrypt from 'bcrypt'
import Hash from '../../../src/encryption/hash'

describe('Hash', () => {
  describe('#gen', () => {
    beforeEach(() => {
      jest.spyOn(bcrypt, 'hash')
    })

    it('signs the provided string using jwt', async () => {
      await Hash.gen('how')
      expect(bcrypt.hash).toHaveBeenCalledWith('how', 4)
    })

    context('in non-test env', () => {
      it('uses longer salt', async () => {
        process.env.NODE_ENV = 'development'
        await Hash.gen('how')
        expect(bcrypt.hash).toHaveBeenCalledWith('how', 11)
        process.env.NODE_ENV = 'test'
      })
    })
  })
})
