import CrystalBall from 'src/crystal-ball'
import Channel from 'src/channel'
import config from 'src/config'

describe('CrystalBall#auth', () => {
  class FishmenChannel extends Channel {
    delete() {}
  }

  it ('calls #auth on the currentNamespace', async () => {
    posess(config, 'channels', 'get').returning({
      'Fishmen': { default: FishmenChannel },
    })

    const crystalBall = new CrystalBall()
    const spy = posess(crystalBall.currentNamespace, 'auth').returning(crystalBall.currentNamespace)
    const result = crystalBall.auth('currentUser', { fish: 10 })

    expect(spy).toHaveBeenCalledWith('currentUser', { fish: 10 })
    expect(result).toBe(crystalBall.currentNamespace)
  })
})

