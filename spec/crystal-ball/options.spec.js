import CrystalBall from 'src/crystal-ball'
import Channel from 'src/channel'
import config from 'src/config'

describe('CrystalBall#options', () => {
  class FishmenChannel extends Channel {
    options() {}
  }

  it ('calls #options on the currentNamespace', async () => {
    posess(config, 'channels', 'get').returning({
      'Fishmen': { default: FishmenChannel },
    })

    const crystalBall = new CrystalBall()
    const spy = posess(crystalBall.currentNamespace, 'options')
    const result = crystalBall.options('fishman', 'fishmen#options', { fish: 10 })

    expect(spy).toHaveBeenCalledWith('fishman', 'fishmen#options', { fish: 10 })
    expect(result).toBe(crystalBall.currentNamespace)
  })
})

