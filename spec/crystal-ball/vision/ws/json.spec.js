import { create } from 'spec/factories'
import CannotCallJSON from 'src/error/crystal-ball/vision/ws/cannot-call-json'

describe('WSVision#json', () => {
  it ('raises Vision::CannotCallJSON', async () => {
    const vision = create('crystalBall.vision', 'test-users', 'index', { ws: true })
    expect(() => {
      vision.json({ fish: 10 })
    }).toThrow(CannotCallJSON)
  })
})

