import { IdType } from '@rvohealth/dream'
import background, { BackgroundQueuePriority } from '.'

type BaseSimpleType = string | number | boolean | null | IdType
type SimpleType = BaseSimpleType | Record<string, BaseSimpleType | Record<string, any>>

export default function backgroundedFunction<ArgType extends SimpleType, ArgsType extends ArgType[]>(
  callbackFunction: (...args: ArgsType) => Promise<void>,
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
): (...args: ArgsType) => Promise<void> {
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
