import PsychicDir from '../../helpers/psychicdir'
import PsychicController from '../../controller'

export default async function getControllerKey(ControllerClass: typeof PsychicController) {
  const controllers = await PsychicDir.controllers()
  return Object.keys(controllers).find(key => controllers[key].toString() === ControllerClass.toString())!
}
