import CrystalBall from 'src/crystal-ball'
import Channel from 'src/channel'
import config from 'src/config'

describe('CrystalBall#post', () => {
  class FishmenChannel extends Channel {
    create() {}
  }

  it ('calls #post on the currentNamespace', async () => {
    posess(config, 'channels', 'get').returning({
      'Fishmen': { default: FishmenChannel },
    })

    const crystalBall = new CrystalBall()
    const spy = posess(crystalBall.currentNamespace, 'post')
    const result = crystalBall.post('fishman', 'fishmen#create', { fish: 10 })

    expect(spy).toHaveBeenCalledWith('fishman', 'fishmen#create', { fish: 10 })
    expect(result).toBe(crystalBall.currentNamespace)
  })
})

