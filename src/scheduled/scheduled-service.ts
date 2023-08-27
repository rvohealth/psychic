import background from '../background'

export default function scheduledService(filepath: string) {
  return class ScheduledService {
    public static async schedule(pattern: string, methodName: string, ...args: any[]) {
      return await background.scheduledMethod(this, pattern, methodName, {
        filepath,
        args,
      })
    }
  }
}
