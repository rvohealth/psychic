import CrystalBall from 'src/crystal-ball'

describe('CrystalBall#given', () => {
  it ('calls #given on the currentNamespace', async () => {
    const crystalBall = new CrystalBall()
    const spy = posess(crystalBall.currentNamespace, 'given').returning(crystalBall.currentNamespace)
    const cb = eavesdrop()
    const result = crystalBall.given('currentUser', cb)

    expect(spy).toHaveBeenCalledWith('currentUser', cb)
    expect(result).toBe(crystalBall.currentNamespace)
  })
})
