import { Background } from './background'
import { ControllerSerializerIndex } from './controller'
import { ControllerHooks } from './controller/hooks'
import { Logger } from './log'

declare global {
  var __howl_background_queue: Background
  var __howl_logger: Logger
  var __howl_controller_serializer_index: ControllerSerializerIndex
  var __howl_controller_hooks: ControllerHooks
}

export {}
