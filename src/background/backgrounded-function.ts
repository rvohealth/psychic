import background, { BackgroundQueuePriority } from '.'

export default function backgroundedFunction<ArgsType extends any[]>(
  callbackFunction: (...args: ArgsType) => Promise<any>,
  {
    defaultExport = false,
    delaySeconds,
    filepath,
    priority = 'default',
  }: {
    defaultExport?: boolean
    delaySeconds?: number
    filepath: string
    priority?: BackgroundQueuePriority
  }
) {
  return async (...args: ArgsType) => {
    await background.func({
      filepath,
      importKey: defaultExport ? 'default' : callbackFunction.name,
      priority,
      args,
      delaySeconds,
    })
  }
}
