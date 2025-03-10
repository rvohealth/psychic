import {
  DecoratorContext,
  DreamSerializer,
  SerializableDreamClassOrViewModelClass,
  SerializableDreamOrViewModel,
} from '@rvohealth/dream'
import PsychicController from './index.js'
import OpenapiEndpointRenderer, { OpenapiEndpointRendererOpts } from '../openapi-renderer/endpoint.js'
import { ControllerHook } from './hooks.js'

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

      psychicControllerClass.controllerHooks.push(
        new ControllerHook(psychicControllerClass.name, methodName.toString(), opts),
      )
    })
  }
}

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
export function OpenAPI<
  I extends
    | SerializableDreamClassOrViewModelClass
    | SerializableDreamClassOrViewModelClass[]
    | typeof DreamSerializer,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
>(modelOrSerializer?: I | OpenapiEndpointRendererOpts<I>, opts?: OpenapiEndpointRendererOpts<I>): any {
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

      if (opts) {
        psychicControllerClass.openapi[methodNameString] = new OpenapiEndpointRenderer(
          modelOrSerializer as I,
          psychicControllerClass,
          methodNameString,
          opts,
        )

        psychicControllerClass['controllerActionMetadata'][methodNameString] ||= {}
        psychicControllerClass['controllerActionMetadata'][methodNameString]['serializerKey'] =
          opts.serializerKey
        //
      } else {
        if (isSerializable(modelOrSerializer)) {
          psychicControllerClass.openapi[methodNameString] = new OpenapiEndpointRenderer(
            modelOrSerializer as I,
            psychicControllerClass,
            methodNameString,
            undefined,
          )
        } else {
          psychicControllerClass.openapi[methodNameString] = new OpenapiEndpointRenderer(
            null,
            psychicControllerClass,
            methodNameString,
            modelOrSerializer as OpenapiEndpointRendererOpts<I>,
          )
        }
      }
    })
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isSerializable(dreamOrSerializerClass: any) {
  return (
    Array.isArray(dreamOrSerializerClass) ||
    hasSerializersGetter(dreamOrSerializerClass as SerializableDreamClassOrViewModelClass) ||
    !!(dreamOrSerializerClass as typeof DreamSerializer)?.isDreamSerializer
  )
}

function hasSerializersGetter(dreamOrSerializerClass: SerializableDreamClassOrViewModelClass): boolean {
  try {
    return !!(dreamOrSerializerClass?.prototype as SerializableDreamOrViewModel)?.serializers
  } catch {
    return false
  }
}
