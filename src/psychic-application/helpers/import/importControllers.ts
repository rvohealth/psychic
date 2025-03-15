import { Request, Response } from 'express'
import PsychicController from '../../../controller/index.js'
import PsychicApplication from '../../index.js'
import globalControllerKeyFromPath from '../globalControllerKeyFromPath.js'
import PsychicImporter from '../PsychicImporter.js'

let _controllers: Record<string, typeof PsychicController>

export default async function importControllers(
  psychicApp: PsychicApplication,
  controllersPath: string,

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  importCb: (path: string) => Promise<any>,
): Promise<Record<string, typeof PsychicController>> {
  if (_controllers) return _controllers

  /**
   * Certain features (e.g. passing a Dream instance to `create` so that it automatically destructures polymorphic type and primary key)
   * need static access to things set up by decorators (e.g. associations). Stage 3 Decorators change the context that is available
   * at decoration time such that the class of a property being decorated is only avilable during instance instantiation. In order
   * to only apply static values once, on boot, `globallyInitializingDecorators` is set to true on Dream, and all Dream models are instantiated.
   */
  PsychicController['globallyInitializingDecorators'] = true

  _controllers = {}

  const controllerClasses = await PsychicImporter.importControllers(controllersPath, importCb)

  for (const [controllerPath, potentialControllerClass] of controllerClasses) {
    if (potentialControllerClass?.isPsychicController) {
      const controllerClass = potentialControllerClass
      const controllerKey = globalControllerKeyFromPath(controllerPath, controllersPath)

      controllerClass['setGlobalName'](controllerKey)

      _controllers[controllerKey] = controllerClass
    }
  }

  for (const [, controllerClass] of controllerClasses) {
    if (controllerClass?.isPsychicController) {
      /**
       * Certain features (e.g. passing a Dream instance to `create` so that it automatically destructures polymorphic type and primary key)
       * need static access to things set up by decorators (e.g. associations). Stage 3 Decorators change the context that is available
       * at decoration time such that the class of a property being decorated is only avilable during instance instantiation. In order
       * to only apply static values once, on boot, `globallyInitializingDecorators` is set to true on Dream, and all Dream models are instantiated.
       */
      new controllerClass({} as Request, {} as Response, {
        action: 'a',
        config: psychicApp,
      })
    }
  }

  PsychicController['globallyInitializingDecorators'] = false

  return _controllers
}

export function getControllersOrFail() {
  if (!_controllers) throw new Error('Must call loadModels before calling getModelsOrFail')
  return _controllers
}

export function getControllersOrBlank() {
  return _controllers || {}
}
