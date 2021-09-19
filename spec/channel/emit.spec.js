import { create } from 'spec/factories'
import Channel from 'src/channel'

describe('Channel#emit', () => {
  it ('passes data to underlying vision', async () => {
    class TestUserChannel extends Channel {}
    const vision = create('crystalBall.vision', 'test-users', 'index', { ws: true })
    const channel = new TestUserChannel(vision)
    const spy = posess(channel.vision, 'emit').returning(true)

    channel.emit('auth:harold', 'hamburgers/johnson', { fish: 10 })
    expect(spy).toHaveBeenCalledWith('auth:harold', 'hamburgers/johnson', { fish: 10 })
  })
})


