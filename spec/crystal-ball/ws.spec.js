import CrystalBall from 'src/crystal-ball'

describe('CrystalBall#ws', () => {
  it ('calls #ws on the currentNamespace', async () => {
    const crystalBall = new CrystalBall()
    const spy = posess(crystalBall.currentNamespace, 'ws').returning({ fish: 20 })
    const result = crystalBall.ws('fishman', 'fishmen#update', { fish: 10 })

    expect(spy).toHaveBeenCalledWith('fishman', 'fishmen#update', { fish: 10 })
    expect(result).toEqual({ fish: 20 })
  })
})

