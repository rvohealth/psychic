import { PsychicApp, PsychicController } from '../../src/index.js'

export default function processDynamicallyDefinedControllers(
  ...controllerClasses: (typeof PsychicController)[]
) {
  PsychicController['globallyInitializingDecorators'] = true
  controllerClasses.forEach(controllerClass => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any
    new controllerClass({} as any, {} as any, { config: new PsychicApp(), action: 'a' })
  })
  PsychicController['globallyInitializingDecorators'] = false
}
