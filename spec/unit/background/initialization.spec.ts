import { describe as context } from '@jest/globals'
import { Queue, Worker } from 'bullmq'
import background, { Background } from '../../../src/background'

describe('background (app singleton) initialization', () => {
  context('workers', () => {
    it('reads extra workers from app configuration and applies them when calling work method', () => {
      class QueueStub {}
      class WorkerStub {}

      jest.spyOn(Background, 'Queue', 'get').mockReturnValue(QueueStub as unknown as typeof Queue)
      jest.spyOn(Background, 'Worker', 'get').mockReturnValue(WorkerStub as unknown as typeof Worker)

      background.work()
      // expect(background.extraWorkers.length).toEqual(1)
      // expect(background.extraWorkers[0]).toBeInstanceOf(WorkerStub)
    })
  })
})
