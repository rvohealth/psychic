import { QueueOptions } from 'bullmq'

export default async function () {
  return {
    // defaultJobOptions: {
    //   attempts: 3,
    //   backoff: {
    //     type: 'exponential',
    //     delay: 1000,
    //   },
    // },
  } as QueueOptions
}
