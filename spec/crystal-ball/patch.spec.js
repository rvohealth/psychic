import CrystalBall from 'src/crystal-ball'
import Channel from 'src/channel'
import config from 'src/config'

describe('CrystalBall#patch', () => {
  class FishmenChannel extends Channel {
    update() {}
  }

  it ('calls #patch on the currentNamespace', async () => {
    posess(config, 'channels', 'get').returning({
      'Fishmen': { default: FishmenChannel },
    })

    const crystalBall = new CrystalBall()
    const spy = posess(crystalBall.currentNamespace, 'patch')
    const result = crystalBall.patch('fishman', 'fishmen#update', { fish: 10 })

    expect(spy).toHaveBeenCalledWith('fishman', 'fishmen#update', { fish: 10 })
    expect(result).toBe(crystalBall.currentNamespace)
  })
})

