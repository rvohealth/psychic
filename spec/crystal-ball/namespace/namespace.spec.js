import CrystalBall from 'src/crystal-ball'
import Namespace from 'src/crystal-ball/namespace'

describe('CrystalBall::Namespace#namespace', () => {
  it ('adds namespace to namespace array', () => {
    const crystalBall = new CrystalBall()
    const ns = new Namespace('fishman', crystalBall.currentNamespace.prefix, crystalBall.app, crystalBall.io)
    const newNs = new Namespace('fishboys', ns.prefix, crystalBall.app, crystalBall.io)

    const result = ns.namespace(newNs)

    expect(ns._namespaces[newNs.routeKey]).toBe(newNs)
    expect(result).toBe(ns)
  })
})

