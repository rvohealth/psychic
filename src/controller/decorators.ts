import { Dream, DreamSerializer } from '@rvohealth/dream'
import PsychicController from '.'
import { ControllerHook } from './hooks'
import OpenapiRenderer, { OpenapiRendererOpts } from '../helpers/openapi-renderer'

export function BeforeAction(
  opts: {
    isStatic?: boolean
    only?: string[]
    except?: string[]
  } = {},
): (target: PsychicController, methodName: string | symbol) => void {
  return function (target: PsychicController, methodName: string | symbol): void {
    const psychicControllerClass: typeof PsychicController = target.constructor as typeof PsychicController
    if (!Object.getOwnPropertyDescriptor(psychicControllerClass, 'controllerHooks'))
      psychicControllerClass.controllerHooks = [...psychicControllerClass.controllerHooks]

    psychicControllerClass.controllerHooks.push(
      new ControllerHook(psychicControllerClass.name, methodName.toString(), opts),
    )
  }
}

export function Openapi<I extends typeof Dream | typeof DreamSerializer>(
  modelOrSerializerCb: () => I,
  opts: OpenapiRendererOpts<I>,
): (target: PsychicController, methodName: string | symbol) => void {
  return function (target: PsychicController, methodName: string | symbol): void {
    const psychicControllerClass: typeof PsychicController = target.constructor as typeof PsychicController
    if (!Object.getOwnPropertyDescriptor(psychicControllerClass, 'openapi'))
      psychicControllerClass.openapi = {}

    psychicControllerClass.openapi[methodName.toString()] = new OpenapiRenderer(modelOrSerializerCb, opts)
  }
}
