import CrystalBall from 'src/crystal-ball'
import Namespace from 'src/crystal-ball/namespace'

describe('CrystalBall#namespace', () => {
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

