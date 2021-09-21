import CrystalBall from 'src/crystal-ball'
import Channel from 'src/channel'
import config from 'src/singletons/config'

describe('CrystalBall#get', () => {
  class FishmenChannel extends Channel {
    index() {}
  }

  it ('calls #get on the currentNamespace', async () => {
    posess(config, 'channels', 'get').returning({
      'Fishmen': { default: FishmenChannel },
    })

    const crystalBall = new CrystalBall()
    const currentNamespaceGetSpy = posess(crystalBall.currentNamespace, 'get')
    const result = crystalBall.get('fishman', 'fishmen#index', { fish: 10 })

    expect(currentNamespaceGetSpy).toHaveBeenCalledWith('fishman', 'fishmen#index', { fish: 10 })
    expect(result).toBe(crystalBall.currentNamespace)
  })
})

