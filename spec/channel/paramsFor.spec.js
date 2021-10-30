import { create } from 'spec/factories'
import Channel from 'src/channel'

describe('Channel#paramsFor', () => {
  class TestUserChannel extends Channel {}

  it ('reads dream class arttributes and extracts them from route', async () => {
    const vision = create('crystalBall.vision', 'test-users', 'index', { params: { email: 'johnson' } })
    const channel = new TestUserChannel(vision)
    const TestUser = create('dream.TestUser')
    expect(channel.paramsFor(TestUser)).toEqual({ email: 'johnson' })
  })

  it ('excludes id field and timestamps', () => {
    const vision = create('crystalBall.vision', 'test-users', 'index', { params: {
      email: 'johnson',
      id: 'hello',
      createdAt: 'smashing',
      updatedAt: 'smashing',
    } })
    const channel = new TestUserChannel(vision)
    const TestUser = create('dream.TestUser')
    expect(channel.paramsFor(TestUser)).toEqual({ email: 'johnson' })
  })
})
