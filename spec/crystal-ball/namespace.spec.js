import CrystalBall from 'src/crystal-ball'
import Namespace from 'src/crystal-ball/namespace'
import Dream from 'src/dream'
import Channel from 'src/channel'
import config from 'src/config'

describe('CrystalBall#namespace', () => {
  class TestUser extends Dream {
  }

  class TestUsersChannel extends Channel {
  }

  jest.spyOn(config, 'dreams', 'get').mockReturnValue({
    'test_user': TestUser,
  })

  jest.spyOn(config, 'schema', 'get').mockReturnValue({
    test_users: {
      id: {
        type: 'int',
        name: 'id',
        primary: true,
        unique: true
      },
      email: {
        type: 'string',
        name: 'email',
      },
      password: {
        type: 'string',
        name: 'password',
      },
      password_digest: {
        type: 'string',
        name: 'password_digest',
      },
    }
  })

  it ('sets the current namespace, calls the callback method, and then unsets the current' +
    'namespace, returning the crystal ball for chainability', async () => {
    const crystalBall = new CrystalBall()
    const ns = new Namespace('fishman', crystalBall.currentNamespace.prefix, crystalBall.app, crystalBall.io)

    const newNamespaceSpy = eavesdrop().returning(ns)
    const currentNamespaceNamespaceSpy = posess(crystalBall.currentNamespace, 'namespace')
    const setCurrentNamespaceSpy = posess(crystalBall, '_setCurrentNamespace')
    const unsetCurrentNamespaceSpy = posess(crystalBall, '_unsetCurrentNamespace')
    const cb = eavesdrop()
    Namespace.new = newNamespaceSpy

    const result = crystalBall.namespace('fishman', cb)

    expect(newNamespaceSpy).toHaveBeenCalledWith('fishman', crystalBall.currentNamespace.prefix, crystalBall.app, crystalBall.io)
    expect(currentNamespaceNamespaceSpy).toHaveBeenCalledWith(ns)
    expect(setCurrentNamespaceSpy).toHaveBeenCalledWith(ns)
    expect(cb).toHaveBeenCalledWith(crystalBall)
    expect(unsetCurrentNamespaceSpy).toHaveBeenCalled()
    expect(result).toBe(crystalBall)
  })
})

