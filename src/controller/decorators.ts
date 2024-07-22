import PsychicController from '.'
import OpenapiEndpointRenderer, {
  DreamsOrSerializersOrViewModels,
  OpenapiEndpointRendererOpts,
} from '../openapi-renderer/endpoint'
import { ControllerHook } from './hooks'

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

/**
 * Used to annotate your controller method in a way that enables
 * Psychic to automatically generate an openapi spec for you. Using
 * this feature, you can easily document your api in typescript, taking
 * advantage of powerful type completion and validation, as well as useful
 * shorthand notation to keep annotations simple when possible.
 *
 * @param modelOrSerializerCb - a function which immediately returns either a serializer class, a dream model class, or else something that has a serializers getter on it.
 * @param body - Optional. The shape of the request body
 * @param headers - Optional. The list of request headers to provide for this endpoint
 * @param many - Optional. whether or not to render a top level array for this serializer
 * @param method - The HTTP method to use when hitting this endpoint
 * @param path - Optional. If passed, this path will be used as the request path. If not, it will be looked up in the conf/routes.ts file.
 * @param query - Optional. A list of query params to provide for this endpoint
 * @param responses - Optional. A list of additional responses that your app may return
 * @param serializerKey - Optional. Use this to override the serializer key to use when looking up a serializer by the provided model or view model.
 * @param status - Optional. The status code this endpoint uses when responding successfully. If not passed, 200 is assummed.
 * @param tags - Optional. string array
 * @param uri - Optional. A list of uri segments that this endpoint uses
 */
export function Openapi<I extends DreamsOrSerializersOrViewModels>(
  modelOrSerializerCb: (() => I) | OpenapiEndpointRendererOpts<I>,
  opts?: OpenapiEndpointRendererOpts<I>,
): (target: PsychicController, methodName: string | symbol) => void {
  return function (target: PsychicController, methodName: string | symbol): void {
    const psychicControllerClass: typeof PsychicController = target.constructor as typeof PsychicController
    if (!Object.getOwnPropertyDescriptor(psychicControllerClass, 'openapi'))
      psychicControllerClass.openapi = {}

    if (opts) {
      psychicControllerClass.openapi[methodName.toString()] = new OpenapiEndpointRenderer(
        modelOrSerializerCb as () => I,
        psychicControllerClass,
        methodName.toString(),
        opts,
      )
    } else {
      if (typeof modelOrSerializerCb === 'function') {
        psychicControllerClass.openapi[methodName.toString()] = new OpenapiEndpointRenderer(
          modelOrSerializerCb as () => I,
          psychicControllerClass,
          methodName.toString(),
          undefined,
        )
      } else {
        psychicControllerClass.openapi[methodName.toString()] = new OpenapiEndpointRenderer(
          null,
          psychicControllerClass,
          methodName.toString(),
          modelOrSerializerCb,
        )
      }
    }
  }
}
