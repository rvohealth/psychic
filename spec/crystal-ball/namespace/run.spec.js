import CrystalBall from 'src/crystal-ball'
import Namespace from 'src/crystal-ball/namespace'
import Channel from 'src/channel'
import config from 'src/singletons/config'
import UnrecognizedRouteError from 'src/error/crystal-ball/namespace/unrecognized-route'

describe('CrystalBall::Namespace#run', () => {
  class FishmenChannel extends Channel {
    index() {}
  }

  context ('with the appropriate routes in config', () => {
    beforeEach(() => {
      posess(config, 'channels', 'get').returning({
        'Fishmen': { default: FishmenChannel },
      })
    })

    it ('calls #addRouteForChannel', async () => {
      const crystalBall = new CrystalBall()
      const ns = new Namespace('fishman', crystalBall.currentNamespace.prefix, crystalBall.app, crystalBall.io)
      const spy = posess(ns, 'addRouteForChannel')

      const result = ns.run('get', 'fishman', 'fishmen#index', { fish: 10 })

      expect(spy).toHaveBeenCalledWith('get', 'fishman', FishmenChannel, 'index', { fish: 10 })
      expect(result).toBe(ns)
    })
  })

  context ('when the routes passed do not match route config', () => {
    it ('raises CrystalBall::Namespace::UnrecognizedRoute', () => {
      const crystalBall = new CrystalBall()
      const ns = new Namespace('fishman', crystalBall.currentNamespace.prefix, crystalBall.app, crystalBall.io)

      expect(() => {
        ns.run('get', 'fishman', 'fishmen#index', { fish: 10 })
      }).toThrow(UnrecognizedRouteError)
    })
  })
})

