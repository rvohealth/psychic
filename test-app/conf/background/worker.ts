import { WorkerOptions } from 'bullmq'

export default async function () {
  return {
    removeOnComplete: {
      age: 3600, // keep up to 1 hour
      count: 1000, // keep up to 1000 jobs
    },
    removeOnFail: {
      age: 24 * 3600 * 31, // keep up to 31 days
    },
  } as WorkerOptions
}
