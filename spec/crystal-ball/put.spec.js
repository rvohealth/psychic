import CrystalBall from 'src/crystal-ball'
import Channel from 'src/channel'
import config from 'src/config'

describe('CrystalBall#put', () => {
  class FishmenChannel extends Channel {
    update() {}
  }

  it ('calls #put on the currentNamespace', async () => {
    posess(config, 'channels', 'get').returning({
      'Fishmen': { default: FishmenChannel },
    })

    const crystalBall = new CrystalBall()
    const spy = posess(crystalBall.currentNamespace, 'put')
    const result = crystalBall.put('fishman', 'fishmen#update', { fish: 10 })

    expect(spy).toHaveBeenCalledWith('fishman', 'fishmen#update', { fish: 10 })
    expect(result).toBe(crystalBall.currentNamespace)
  })
})

