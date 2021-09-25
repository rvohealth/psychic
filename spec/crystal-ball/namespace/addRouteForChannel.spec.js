import CrystalBall from 'src/crystal-ball'
import Namespace from 'src/crystal-ball/namespace'
import config from 'src/config'

describe('CrystalBall::Namespace#addRouteForChannel', () => {
  context ('when route is a standard http route', () => {
    it ('binds route to express server', async () => {
      const crystalBall = new CrystalBall()
      const ns = new Namespace('fishman', crystalBall.currentNamespace.prefix, crystalBall.app, crystalBall.io)
      const cb = async () => {}
      posess(ns, '_buildHTTPResponse').returning(cb)
      const spy = posess(ns.app, 'post').returning(true)

      ns.addRouteForChannel(
        'post',
        'fishmen',
        'fishmen',
        'index',
        {
          authKey: null,
          _isResource: false,
          isWS: false,
        }
      )

      expect(ns._routes['post:fishman/fishmen']).toEqual(expect.objectContaining({
        route: 'fishmen',
        fullRoute: '/fishman/fishmen',
        httpMethod: 'post',
        channel: 'fishmen',
        method: 'index',
        parsed: {
          orig: '/fishman/fishmen',
          key: 'fishman/fishmen',
          segments: [ 'fishman', 'fishmen' ],
          params: []
        },
        belongsToResource: false,
        isResource: false,
        authKey: null,
        isWS: false,
      }))
      expect(spy).toHaveBeenCalledWith('/fishman/fishmen', cb)
    })
  })

  context ('when route is a ws route', () => {
    it ('does not bind to http server', async () => {
      const crystalBall = new CrystalBall()
      const ns = new Namespace('fishman', crystalBall.currentNamespace.prefix, crystalBall.app, crystalBall.io)
      const cb = async () => {}
      posess(ns, '_buildHTTPResponse').returning(cb)
      const spy = posess(ns.app, 'post').returning(true)

      ns.addRouteForChannel(
        'post',
        'fishmen',
        'fishmen',
        'index',
        {
          authKey: null,
          _isResource: false,
          isWS: true,
        }
      )

      expect(ns._routes['post:fishman/fishmen']).toEqual(expect.objectContaining({
        route: 'fishmen',
        fullRoute: '/fishman/fishmen',
        httpMethod: 'post',
        channel: 'fishmen',
        method: 'index',
        parsed: {
          orig: '/fishman/fishmen',
          key: 'fishman/fishmen',
          segments: [ 'fishman', 'fishmen' ],
          params: []
        },
        belongsToResource: false,
        isResource: false,
        authKey: null,
        isWS: true,
      }))
      expect(spy).not.toHaveBeenCalled()
    })
  })

  context ('when route contains an authKey', () => {
    it ('registers authKey with config', async () => {
      const crystalBall = new CrystalBall()
      const ns = new Namespace('fishman', crystalBall.currentNamespace.prefix, crystalBall.app, crystalBall.io)
      const spy = posess(config, 'registerAuthKey').returning(true)

      ns.addRouteForChannel(
        'post',
        'fishmen',
        'fishmen',
        'index',
        {
          authKey: 'currentFishman',
          _isResource: false,
          isWS: true,
        }
      )

      expect(spy).toHaveBeenCalledWith('currentFishman', expect.objectContaining({
        route: 'fishmen',
        fullRoute: '/fishman/fishmen',
        httpMethod: 'post',
        channel: 'fishmen',
        method: 'index',
        parsed: {
          orig: '/fishman/fishmen',
          key: 'fishman/fishmen',
          segments: [ 'fishman', 'fishmen' ],
          params: []
        },
        belongsToResource: false,
        isResource: false,
        authKey: 'currentFishman',
        isWS: true,
      }))
    })
  })
})
