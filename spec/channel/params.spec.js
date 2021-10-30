import { create } from 'spec/factories'
import Channel from 'src/channel'
import TestUser from 'spec/support/testapp/app/dreams/test-user'

describe('Channel#params', () => {
  class TestUserChannel extends Channel {}

  it ('returns request params', async () => {
    const vision = create('crystalBall.vision', 'test-users', 'index', { params: { fish: 10 } })
    const channel = new TestUserChannel(vision)

    expect(channel.params).toEqual({ fish: 10 })
  })

  context ('passed { from: DreamClass }', () => {
    it ('reads dream class arttributes and extracts them from route', async () => {
      expect(channel.params).toEqual({ fish: 10 })
    })
  })
})
