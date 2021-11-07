import { create } from 'spec/factories'
import Channel from 'src/channel'

describe('Channel#params', () => {
  class TestUserChannel extends Channel {}
  const vision = create('crystalBall.vision', 'test-users', 'index', { params: { fish: 10 } })
  const channel = new TestUserChannel(vision)

  it ('returns request params', () => {
    expect(channel.params.all).toEqual({ fish: 10 })
  })

  context ('passed { from: DreamClass }', () => {
    it ('reads dream class arttributes and extracts them from route', () => {
      expect(channel.params.all).toEqual({ fish: 10 })
    })
  })
})
