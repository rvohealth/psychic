import CrystalBall from 'src/crystal-ball'

describe('CrystalBall#auth', () => {
  it ('calls #auth on the currentNamespace', async () => {
    const crystalBall = new CrystalBall()
    const spy = posess(crystalBall.currentNamespace, 'auth').returning(crystalBall.currentNamespace)
    const result = crystalBall.auth('currentUser', { fish: 10 })

    expect(spy).toHaveBeenCalledWith('currentUser', { fish: 10 })
    expect(result).toBe(crystalBall.currentNamespace)
  })
})

