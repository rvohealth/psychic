import background, { BackgroundQueuePriority } from '../background'

export default function scheduledService(filepath: string, priority: BackgroundQueuePriority = 'not_urgent') {
  return class ScheduledService {
    public static async schedule(pattern: string, methodName: string, ...args: any[]) {
      return await background.scheduledMethod(this, pattern, methodName, {
        filepath,
        args,
        priority,
      })
    }
  }
}
