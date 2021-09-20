import CrystalBall from 'src/crystal-ball'
import Namespace from 'src/crystal-ball/namespace'

describe('CrystalBall::Namespace#auth', () => {
  context ('when channel name is passed directly', () => {
    it ('calls #post, passing args', async () => {
      const crystalBall = new CrystalBall()
      const ns = new Namespace('fishman', crystalBall.currentNamespace.prefix, crystalBall.app, crystalBall.io)
      const spy = posess(ns, 'post').returning({ fish: 20 })

      const result = ns.auth('currentFishman', { channel: 'fishmen' })

      expect(spy).toHaveBeenCalledWith(
        'auth',
        'fishmen#auth',
        expect.objectContaining({ authKey: 'currentFishman', channel: 'fishmen' })
      )
      expect(result).toEqual({ fish: 20 })
    })
  })

  context ('when channel name is not passed directly', () => {
    it ('calls #post, passing args', async () => {
      const crystalBall = new CrystalBall()
      const ns = new Namespace('fishman', crystalBall.currentNamespace.prefix, crystalBall.app, crystalBall.io)
      posess(crystalBall, 'currentNamespace', 'get').returning('FishmenChannel')
      const spy = posess(ns, 'post').returning({ fish: 20 })

      const result = ns.auth('currentFishman')

      expect(spy).toHaveBeenCalledWith(
        'auth',
        'fishmen#auth',
        expect.objectContaining({ authKey: 'currentFishman' })
      )
      expect(result).toEqual({ fish: 20 })
    })
  })
})
