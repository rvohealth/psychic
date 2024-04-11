import background, { BackgroundQueuePriority } from '../background'

export default function scheduledService(filepath: string, priority: BackgroundQueuePriority = 'not_urgent') {
  return class ScheduledService {
    public static async schedule(
      pattern: string,
      methodName: string,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...args: any[]
    ) {
      return await background.scheduledMethod(this, pattern, methodName, {
        filepath,
        args,
        priority,
      })
    }
  }
}
