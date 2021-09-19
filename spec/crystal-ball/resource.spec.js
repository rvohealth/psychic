import CrystalBall from 'src/crystal-ball'

describe('CrystalBall#resource', () => {
  context ('with callback passed', () => {
    it ('applies the current namespace, runs then callback, and then unapplies the namespace', async () => {
      const crystalBall = new CrystalBall()
      const resourceSpy = posess(crystalBall.currentNamespace, 'resource').returning({ fish: 20 })
      const setCurrentNamespaceSpy = posess(crystalBall, '_setCurrentNamespace').returning(true)
      const unsetCurrentNamespaceSpy = posess(crystalBall, '_unsetCurrentNamespace').returning(true)
      const cb = eavesdrop()

      crystalBall.resource('fishmen', { fish: 10 }, cb)

      expect(resourceSpy).toHaveBeenCalledWith('fishmen', { fish: 10 }, cb)
      expect(setCurrentNamespaceSpy).toHaveBeenCalledWith({ fish: 20 })
      expect(cb).toHaveBeenCalledWith(crystalBall)
      expect(unsetCurrentNamespaceSpy).toHaveBeenCalled()
    })
  })

  context ('without callback passed', () => {
    it ('calls #resource on the currentNamespace', async () => {
      const crystalBall = new CrystalBall()
      const resourceSpy = posess(crystalBall.currentNamespace, 'resource').returning({ fish: 20 })

      const result = crystalBall.resource('fishmen', { fish: 10 })

      expect(resourceSpy).toHaveBeenCalledWith('fishmen', { fish: 10 })
      expect(result).toEqual({ fish: 20 })
    })
  })
})
