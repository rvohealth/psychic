import CrystalBall from 'src/crystal-ball'
import Namespace from 'src/crystal-ball/namespace'

describe('CrystalBall::Namespace#get', () => {
  it ('calls #run, passing args', async () => {
    const crystalBall = new CrystalBall()
    const ns = new Namespace('fishman', crystalBall.currentNamespace.prefix, crystalBall.app, crystalBall.io)
    const spy = posess(ns, 'run').returning({ fish: 20 })

    const result = ns.get('fishman', 'fishmen#index', { fish: 10 })

    expect(spy).toHaveBeenCalledWith('get', 'fishman', 'fishmen#index', { fish: 10 })
    expect(result).toEqual({ fish: 20 })
  })
})
