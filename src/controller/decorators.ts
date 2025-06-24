import { DecoratorContext, Dream, DreamSerializable, DreamSerializableArray } from '@rvoh/dream'
import OpenapiEndpointRenderer, { OpenapiEndpointRendererOpts } from '../openapi-renderer/endpoint.js'
import isSerializable from './helpers/isSerializable.js'
import { ControllerHook } from './hooks.js'
import PsychicController from './index.js'

export function BeforeAction(
  opts: {
    isStatic?: boolean
    only?: string[]
    except?: string[]
  } = {},
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any {
  return function (_: undefined, context: DecoratorContext) {
    const methodName = context.name

    context.addInitializer(function (this: PsychicController) {
      const psychicControllerClass: typeof PsychicController = this.constructor as typeof PsychicController
      if (!psychicControllerClass['globallyInitializingDecorators']) {
        return
      }

      if (!Object.getOwnPropertyDescriptor(psychicControllerClass, 'controllerHooks'))
        psychicControllerClass.controllerHooks = [...psychicControllerClass.controllerHooks]

      if (!psychicControllerClass.controllerHooks.find(hook => hook.methodName === methodName)) {
        psychicControllerClass.controllerHooks.push(
          new ControllerHook(psychicControllerClass.name, methodName.toString(), opts),
        )
      }
    })
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function OpenAPI(): any

export function OpenAPI<const ForOption extends typeof Dream>(
  opts: OpenapiEndpointRendererOpts<undefined, ForOption>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any

export function OpenAPI<
  const I extends DreamSerializable | DreamSerializableArray,
  const ForOption extends typeof Dream,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
>(modelOrSerializer: I, opts?: OpenapiEndpointRendererOpts<I, ForOption>): any

/**
 * Used to annotate your controller method in a way that enables
 * Psychic to automatically generate an openapi spec for you. Using
 * this feature, you can easily document your api in typescript, taking
 * advantage of powerful type completion and validation, as well as useful
 * shorthand notation to keep annotations simple when possible.
 *
 * @param modelOrSerializer - a function which immediately returns either a serializer class, a dream model class, or else something that has a serializers getter on it.
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
export function OpenAPI(
  modelOrSerializer?: unknown,
  _opts?: unknown,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any {
  return function (_: undefined, context: DecoratorContext) {
    const methodName = context.name

    context.addInitializer(function (this: PsychicController) {
      const psychicControllerClass: typeof PsychicController = this.constructor as typeof PsychicController
      if (!psychicControllerClass['globallyInitializingDecorators']) {
        return
      }

      const methodNameString = methodName.toString()

      if (!Object.getOwnPropertyDescriptor(psychicControllerClass, 'openapi'))
        psychicControllerClass.openapi = {}

      if (!Object.getOwnPropertyDescriptor(psychicControllerClass, 'controllerActionMetadata'))
        psychicControllerClass['controllerActionMetadata'] = {}

      if (_opts) {
        const opts = _opts as OpenapiEndpointRendererOpts
        psychicControllerClass.openapi[methodNameString] = new OpenapiEndpointRenderer(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          modelOrSerializer as any,
          psychicControllerClass,
          methodNameString,
          opts,
        )

        psychicControllerClass['controllerActionMetadata'][methodNameString] ||= {}
        psychicControllerClass['controllerActionMetadata'][methodNameString]['serializerKey'] = (
          opts as { serializerKey: string }
        ).serializerKey
        //
      } else {
        if (isSerializable(modelOrSerializer)) {
          psychicControllerClass.openapi[methodNameString] = new OpenapiEndpointRenderer(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            modelOrSerializer as any,
            psychicControllerClass,
            methodNameString,
            undefined,
          )
        } else {
          psychicControllerClass.openapi[methodNameString] = new OpenapiEndpointRenderer(
            null,
            psychicControllerClass,
            methodNameString,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            modelOrSerializer as OpenapiEndpointRendererOpts<any>,
          )
        }
      }
    })
  }
}
