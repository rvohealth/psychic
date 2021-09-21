import CrystalBall from 'src/crystal-ball'
import Namespace from 'src/crystal-ball/namespace'
import InvalidGivenType from 'src/error/crystal-ball/namespace/invalid-given-type'

describe('CrystalBall::Namespace#given', () => {
  it ('persists the given type to the namespace, runs the callback, and then unloads the given type', () => {
    const crystalBall = new CrystalBall()
    const ns = new Namespace('fishman', crystalBall.currentNamespace.prefix, crystalBall.app, crystalBall.io)
    const setGivenTypeSpy = posess(ns, 'setCurrentGivenType')
    const unsetGivenTypeSpy = posess(ns, 'unsetCurrentGivenType')
    const cb = eavesdrop()

    ns.given('auth:currentUser', cb)

    expect(setGivenTypeSpy).toHaveBeenCalledWith('auth', 'currentUser')
    expect(cb).toHaveBeenCalledWith(ns)
    expect(unsetGivenTypeSpy).toHaveBeenCalled()
  })

  context ('provided given type is invalid', () => {
    it ('raises Namespace::InvalidGivenType', () => {
      const crystalBall = new CrystalBall()
      const ns = new Namespace('fishman', crystalBall.currentNamespace.prefix, crystalBall.app, crystalBall.io)
      const cb = eavesdrop()

      expect(() => {
        ns.given('invalidKey:currentUser', cb)
      }).toThrow(InvalidGivenType)
    })
  })
})
