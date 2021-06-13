import { jest } from '@jest/globals'
import esp from 'src/singletons/esp'

describe('esp: captures and calls listeners correctly', () => {
  it ('fires listeners, passing payload', () => {
    const spy1 = jest.fn()
    const spy2 = jest.fn()
    esp.on('ws:to:authToken', spy1)
    esp.on('ws:to:authToken', spy2)
    esp.transmit('ws:to:authToken', { fish: 10 })
    expect(spy1).toHaveBeenCalledWith({ fish: 10 })
    expect(spy2).toHaveBeenCalledWith({ fish: 10 })
  })
})

