import CrystalBall from 'src/crystal-ball'
import Channel from 'src/channel'
import config from 'src/singletons/config'

describe('CrystalBall#delete', () => {
  class FishmenChannel extends Channel {
    delete() {}
  }

  it ('calls #delete on the currentNamespace', async () => {
    posess(config, 'channels', 'get').returning({
      'Fishmen': { default: FishmenChannel },
    })

    const crystalBall = new CrystalBall()
    const spy = posess(crystalBall.currentNamespace, 'delete')
    const result = crystalBall.delete('fishman', 'fishmen#delete', { fish: 10 })

    expect(spy).toHaveBeenCalledWith('fishman', 'fishmen#delete', { fish: 10 })
    expect(result).toBe(crystalBall.currentNamespace)
  })
})

