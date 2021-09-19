import { create } from 'spec/factories'
import Channel from 'src/channel'

describe('Channel#json', () => {
  it ('passes object to vision for encoding', async () => {
    class TestUserChannel extends Channel {}
    const vision = create('crystalBall.vision', 'test-users', 'index', {})
    const channel = new TestUserChannel(vision)
    const spy = posess(channel.vision, 'json')

    channel.json({ fish: 10 })
    expect(spy).toHaveBeenCalledWith({ fish: 10 }, undefined)
  })
})


